import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'

// Interface para o resultado da consulta SQL
interface PasswordResetTokenRecord {
  id: string;
  email: string;
  token: string;
  expires: Date;
}

const SALT_ROUNDS = 10 // Deve ser o mesmo valor usado em 'esqueci-senha'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token e nova senha são obrigatórios' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }

    // 1. Encontrar o registro do token HASHADO no banco pelo email
    //    Não podemos buscar diretamente pelo token original.
    //    Em vez disso, buscamos todos os tokens não expirados e comparamos.
    
    let dbTokenRecord = null;
    try {
      // Buscar todos os tokens não expirados
      const tokens = await prisma.$queryRaw<PasswordResetTokenRecord[]>`
        SELECT id, email, token, expires 
        FROM password_reset_tokens 
        WHERE expires > NOW()
      `;
      
      // Comparar o token fornecido com cada token hashado no banco
      for (const record of tokens) {
        const isMatch = await bcrypt.compare(token, record.token)
        if (isMatch) {
          dbTokenRecord = record
          break
        }
      }

      if (!dbTokenRecord) {
        console.log(`Tentativa de recuperação com token inválido ou expirado: ${token.substring(0, 10)}...`)
        return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 400 })
      }

      // Token encontrado e válido!
      console.log(`Token válido encontrado para email: ${dbTokenRecord.email}`)

      // 2. Hash da nova senha
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

      // 3. Atualizar a senha do usuário na tabela users
      const updatedUser = await prisma.users.update({
        where: { email: dbTokenRecord.email }, // Usar o email do registro do token
        data: { password: hashedPassword },
      })

      if (!updatedUser) {
        // Isso não deveria acontecer se o token era válido, mas é uma checagem extra
        console.error(`Erro: Usuário não encontrado para atualização de senha com email ${dbTokenRecord.email}`)
        return NextResponse.json({ error: 'Erro ao encontrar usuário para atualizar senha.' }, { status: 500 })
      }

      console.log(`Senha atualizada com sucesso para ${dbTokenRecord.email}`)

      // 4. Excluir o token da tabela password_reset_tokens
      await prisma.$executeRawUnsafe(`
        DELETE FROM password_reset_tokens 
        WHERE id = $1
      `, dbTokenRecord.id);

      console.log(`Token de recuperação excluído para ${dbTokenRecord.email}`)

      // 5. Retornar sucesso
      return NextResponse.json({ message: 'Senha redefinida com sucesso!' })
    } catch (dbError) {
      console.error('Erro ao manipular banco de dados:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Erro no processo de recuperar-senha:', error)
    // Evitar expor detalhes do erro no cliente
    return NextResponse.json({ error: 'Erro interno do servidor ao tentar redefinir a senha.' }, { status: 500 })
  }
} 