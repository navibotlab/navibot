'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Folder, 
  User, 
  Users, 
  Layers, 
  Phone, 
  FileText, 
  Lock, 
  Plus, 
  MoreVertical 
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import dynamic from 'next/dynamic';

type TabType = 'informacoes-conta' | 'extrato' | 'login-seguranca' | 'usuario' | 'setores' | 'telefonia';

// Carregamento dinâmico da página de usuários
const UsuariosPage = dynamic(() => import('@/app/admin/configuracoes/usuarios/page'), {
  loading: () => <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>,
  ssr: false
});

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function ContaPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('informacoes-conta');
  const [userData, setUserData] = useState({
    id: '',
    name: '',
    email: '',
    role: '',
    status: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [userPermissions, setUserPermissions] = useState<any>(null);

  // Carregar dados do usuário quando a sessão estiver disponível
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      // Primeiro, defina os valores que temos na sessão
      setUserData({
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
        role: '',
        status: ''
      });
      
      setFormData(prev => ({
        ...prev,
        name: session.user.name || ''
      }));

      // Buscar permissões do usuário
      fetch('/api/user/me/permissions')
        .then(res => res.json())
        .then(data => {
          setUserPermissions(data);
        })
        .catch(err => {
          console.error('Erro ao carregar permissões:', err);
        });

      // Depois, busque os detalhes completos da API
      fetch(`/api/user/${session.user.id}`)
        .then(async res => {
          const data = await res.json();
          
          if (!res.ok) {
            throw new Error(data.error || `Erro ${res.status}: Não foi possível carregar os dados do usuário`);
          }
          
          return data;
        })
        .then(data => {
          if (data) {
            setUserData({
              id: data.id,
              name: data.name || '',
              email: data.email || '',
              role: data.role || '',
              status: data.status || ''
            });
            
            setFormData(prev => ({
              ...prev,
              name: data.name || ''
            }));
          }
        })
        .catch(err => {
          console.error('Erro ao carregar dados do usuário:', err);
          setError('Não foi possível carregar os dados do usuário.');
        });
    }
  }, [session, status]);

  // Funções de manipulação de formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updateData: any = { name: formData.name };

      // Se estiver atualizando a senha, incluir no payload
      if (formData.newPassword && formData.currentPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setError('A nova senha e a confirmação não coincidem.');
          setLoading(false);
          return;
        }
        
        if (formData.newPassword.length < 6) {
          setError('A nova senha deve ter pelo menos 6 caracteres.');
          setLoading(false);
          return;
        }

        updateData.currentPassword = formData.currentPassword;
        updateData.password = formData.newPassword;
      }

      // Enviar solicitação de atualização
      const response = await fetch(`/api/user/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erro ${response.status}: Erro ao atualizar perfil`);
      }

      // Atualizar dados na sessão
      if (data.user) {
        await update({
          ...session,
          user: {
            ...session?.user,
            name: data.user.name
          }
        });
      }

      setSuccess('Perfil atualizado com sucesso');
      
      // Limpar campos de senha
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      setError(err.message || 'Ocorreu um erro ao atualizar seu perfil');
    } finally {
      setLoading(false);
    }
  };

  // Formata a data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Exibir status de usuário com cores apropriadas
  const renderStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500">Ativo</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">Inativo</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Mostrar loading enquanto carrega a sessão
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Redirecionar se não estiver autenticado
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#0F1115]">
      {/* Menu lateral */}
      <aside className="w-full md:w-1/4 lg:w-1/5 bg-[#1A1D24] border-r border-gray-800">
        <nav className="sticky top-0 p-4">
          <h2 className="text-lg font-semibold mb-4 text-white">Conta</h2>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setActiveTab('informacoes-conta')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'informacoes-conta'
                    ? 'bg-[#0F1115] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#0F1115]'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Informações da conta</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('extrato')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'extrato'
                    ? 'bg-[#0F1115] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#0F1115]'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Extrato</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('login-seguranca')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'login-seguranca'
                    ? 'bg-[#0F1115] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#0F1115]'
                }`}
              >
                <Lock className="h-4 w-4" />
                <span>Login e Segurança</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('usuario')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'usuario'
                    ? 'bg-[#0F1115] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#0F1115]'
                }`}
                disabled={(userPermissions?.permissions?.users?.manage === false)}
                title={(userPermissions?.permissions?.users?.manage === false) ? 'Você não tem permissão para gerenciar usuários' : ''}
              >
                <Users className={`h-4 w-4 ${(userPermissions?.permissions?.users?.manage === false) ? 'opacity-50' : ''}`} />
                <span className={`${(userPermissions?.permissions?.users?.manage === false) ? 'opacity-50' : ''}`}>Gerenciar Usuários</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('setores')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'setores'
                    ? 'bg-[#0F1115] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#0F1115]'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Setores</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('telefonia')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'telefonia'
                    ? 'bg-[#0F1115] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#0F1115]'
                }`}
              >
                <Phone className="h-4 w-4" />
                <span>Telefonia</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-white">
            {activeTab === 'informacoes-conta' && 'Conta'}
            {activeTab === 'extrato' && 'Extrato'}
            {activeTab === 'login-seguranca' && 'Login e Segurança'}
            {activeTab === 'usuario' && 'Usuários'}
            {activeTab === 'setores' && 'Setores'}
            {activeTab === 'telefonia' && 'Telefonia'}
          </h1>
        
          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-800 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-6 bg-green-900/50 border-green-800">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertTitle className="text-green-400">Sucesso</AlertTitle>
              <AlertDescription className="text-green-400">{success}</AlertDescription>
            </Alert>
          )}

          {/* Conteúdo específico para cada aba */}
          {activeTab === 'informacoes-conta' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#0F1115] border-gray-800 text-white">
                <CardHeader>
                  <CardTitle>Informações da Conta</CardTitle>
                  <CardDescription className="text-gray-400">Suas informações básicas</CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateProfile}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-400">Nome</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Seu nome"
                        className="bg-[#1A1D24] border-gray-800 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-400">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        value={userData.email}
                        disabled
                        className="bg-[#1A1D24] border-gray-800 text-white"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar alterações
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          )}

          {activeTab === 'login-seguranca' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#0F1115] border-gray-800 text-white">
                <CardHeader>
                  <CardTitle>Alterar Senha</CardTitle>
                  <CardDescription className="text-gray-400">Atualize sua senha e configurações de segurança</CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateProfile}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-gray-400">Senha Atual</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="Digite sua senha atual"
                        className="bg-[#1A1D24] border-gray-800 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-gray-400">Nova Senha</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Digite a nova senha"
                        className="bg-[#1A1D24] border-gray-800 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-400">Confirmar Nova Senha</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirme a nova senha"
                        className="bg-[#1A1D24] border-gray-800 text-white"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Atualizar senha
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          )}

          {activeTab === 'extrato' && (
            <Card className="bg-[#0F1115] border-gray-800 text-white">
              <CardHeader>
                <CardTitle>Extrato</CardTitle>
                <CardDescription className="text-gray-400">Histórico de cobranças e pagamentos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  O histórico de cobranças e pagamentos estará disponível em breve.
                </p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'setores' && (
            <Card className="bg-[#0F1115] border-gray-800 text-white">
              <CardHeader>
                <CardTitle>Setores</CardTitle>
                <CardDescription className="text-gray-400">Configure os setores da sua empresa</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Configure os setores da sua empresa para organizar melhor os usuários e permissões.
                </p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'telefonia' && (
            <Card className="bg-[#0F1115] border-gray-800 text-white">
              <CardHeader>
                <CardTitle>Telefonia</CardTitle>
                <CardDescription className="text-gray-400">Configure as integrações de telefonia</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Configure as integrações de telefonia para sua empresa.
                </p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'usuario' && userPermissions?.permissions?.users?.manage !== false && (
            <div className="w-full">
              <UsuariosPage isEmbedded={true} />
            </div>
          )}
          
          {activeTab === 'usuario' && userPermissions?.permissions?.users?.manage === false && (
            <Card className="bg-[#0F1115] border-gray-800 text-white">
              <CardHeader>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription className="text-gray-400">
                  Você não tem permissão para gerenciar usuários.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="bg-blue-900/20 border-blue-800 mb-4">
                  <AlertCircle className="h-4 w-4 text-blue-400" />
                  <AlertTitle className="text-blue-400">Informação</AlertTitle>
                  <AlertDescription className="text-blue-400">
                    Para obter acesso a esta funcionalidade, fale com o administrador do sistema.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
} 