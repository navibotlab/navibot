import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";
import { safeLog, safeErrorLog } from "@/lib/utils/security";

interface DBUser {
  id: string;
  email: string;
  name: string | null;
  password: string;
  workspaceId: string;
  status: string;
  role: string;
}

// Função para mascarar dados sensíveis em logs
const secureLog = (message: string, data?: any) => {
  // Dados originais que não devem ser expostos
  if (!data) {
    console.log(message)
    return
  }

  // Clone para não modificar os dados originais
  const sanitizedData = { ...data }
  
  // Mascarar informações sensíveis
  if (sanitizedData.email) {
    const [username, domain] = sanitizedData.email.split('@')
    sanitizedData.email = `${username.slice(0, 3)}***@${domain}`
  }
  
  if (sanitizedData.id) {
    sanitizedData.id = sanitizedData.id.slice(0, 5) + '***'
  }
  
  if (sanitizedData.workspaceId) {
    sanitizedData.workspaceId = sanitizedData.workspaceId.slice(0, 5) + '***'
  }
  
  // Remover tokens e informações de senha
  delete sanitizedData.password
  delete sanitizedData.token
  delete sanitizedData.accessToken
  delete sanitizedData.refreshToken
  
  console.log(message, sanitizedData)
}

// Estendendo o tipo User do NextAuth para incluir a propriedade id e workspaceId
declare module "next-auth" {
  interface User {
    id: string;
    workspaceId: string;
  }
  
  interface Session {
    user: {
      id: string;
      workspaceId: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }

  interface JWT {
    id: string;
    workspaceId: string;
  }
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Please provide process.env.NEXTAUTH_SECRET');
}

// Cache de sessão para evitar consultas repetidas
const sessionCache = new Map();

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  pages: {
    signIn: "/login",
    error: "/login",
    signOut: "/login"
  },
  // Configuração para evitar credenciais na URL em produção
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 // 30 dias - explicitamente definido aqui também
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  logger: {
    error(code, metadata) {
      safeErrorLog('NextAuth Error', code, metadata);
    },
    warn(code) {
      console.warn('NextAuth Warning:', { code });
    },
    debug(code, metadata) {
      // Habilitando logs de debug para diagnóstico
      console.log('NextAuth Debug:', { code, metadata });
    }
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('🔐 Evento de login ocorreu!', { userId: user.id });
    },
    signOut: async (message) => {
      // Limpar cache quando fizer logout
      const email = message?.session?.user?.email;
      if (email) {
        sessionCache.delete(email);
        secureLog('Sessão removida do cache', { email });
      }
    },
  },
  debug: process.env.NODE_ENV !== 'production', // Ativar depuração em desenvolvimento
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        try {
          safeLog('Iniciando autorização', { email: credentials?.email }, ['email']);

          if (!credentials?.email || !credentials?.password) {
            safeLog('Credenciais faltando', {});
            return null;
          }

          // Verificar se temos o usuário em cache (para reduzir consultas)
          const cacheKey = credentials.email;
          if (sessionCache.has(cacheKey)) {
            safeLog('Usuário encontrado em cache', { email: credentials.email }, ['email']);
            return sessionCache.get(cacheKey);
          }

          // Usando a tabela users
          const result = await prisma.$queryRaw<DBUser[]>`
            SELECT id, email, name, password, "workspaceId", status, role
            FROM users
            WHERE email = ${credentials.email}
            LIMIT 1
          `;

          const user = result[0];
          
          if (!user) {
            safeLog('Usuário não encontrado', { email: credentials.email }, ['email']);
            return null;
          }

          // Verificar se o usuário está ativo
          if (user.status !== 'active') {
            safeLog('Usuário não está ativo', { email: credentials.email, status: user.status }, ['email']);
            return null;
          }

          const isPasswordValid = await compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            safeLog('Autenticação falhou', { email: credentials.email }, ['email']);
            return null;
          }

          // Criando objeto de usuário autenticado
          const authenticatedUser = {
            id: user.id,
            email: user.email,
            name: user.name || '',
            workspaceId: user.workspaceId
          };
          
          // Salvando em cache para reduzir consultas futuras
          sessionCache.set(cacheKey, authenticatedUser);
          
          safeLog('Login bem sucedido', {}, ['email']);
          return authenticatedUser;
        } catch (error) {
          safeErrorLog('Erro durante autorização', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Se for callback do login, sempre redirecionar para dashboard
      if (url.includes('/api/auth/callback') || url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/admin/dashboard`;
      }
      // Se a URL é relativa, retornar baseada na baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Se a URL pertence ao mesmo host, permitir
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Caso contrário, ir para dashboard
      return `${baseUrl}/admin/dashboard`;
    },
    async session({ session, token }) {
      // Usar safeLog para garantir mascaramento de dados sensíveis
      safeLog('NextAuth callback - session', { 
        tokenExists: !!token, 
        sessionUserExists: !!session?.user 
      });
      
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.workspaceId = token.workspaceId as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      // Usar safeLog para garantir mascaramento de dados sensíveis
      safeLog('NextAuth callback - jwt', { 
        tokenExists: !!token, 
        userExists: !!user 
      });
      
      if (user) {
        token.id = user.id;
        token.workspaceId = user.workspaceId;
      }
      return token;
    },
  },
}; 