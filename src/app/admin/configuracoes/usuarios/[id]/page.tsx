'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Loader2, AlertCircle, ChevronLeft, User, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Usando a mesma interface User definida no componente UserSettings
interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    status: ''
  });
  const [userPermissions, setUserPermissions] = useState<{role: string}>({role: ''});
  const userId = params?.id;

  // Carregar permissões do usuário autenticado
  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetch('/api/user/me/permissions')
        .then(res => res.json())
        .then(data => {
          setUserPermissions(data);
        })
        .catch(err => {
          console.error('Erro ao carregar permissões:', err);
        });
    }
  }, [status, session]);

  // Carregar detalhes do usuário
  useEffect(() => {
    if (status === 'authenticated' && session && userId) {
      fetchUserDetails();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, userId]);

  const fetchUserDetails = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/user/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erro ${response.status}: Erro ao carregar usuário`);
      }

      setUser(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        role: data.role || '',
        status: data.status || ''
      });
    } catch (err: any) {
      console.error('Erro ao buscar detalhes do usuário:', err);
      setError(err.message || 'Ocorreu um erro ao buscar os detalhes do usuário');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar o estado do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Atualizar valores dos selects
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Enviar formulário de atualização
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        name: formData.name,
        role: formData.role,
        status: formData.status
      };

      const response = await fetch(`/api/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erro ${response.status}: Erro ao atualizar usuário`);
      }

      setSuccess('Usuário atualizado com sucesso');
      
      // Atualizar os dados do usuário na tela
      setUser(prev => prev ? {...prev, ...data.user} : null);
    } catch (err: any) {
      console.error('Erro ao atualizar usuário:', err);
      setError(err.message || 'Ocorreu um erro ao atualizar o usuário');
    } finally {
      setSaving(false);
    }
  };

  // Atualizar o estado do usuário quando ele for alterado
  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Mostrar loading enquanto carrega a sessão
  if (status === 'loading' || loading) {
    return (
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Mostrar erro se não conseguir carregar os detalhes
  if (error || !user) {
    return (
      <div className="p-6 h-full flex flex-col">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/configuracoes/usuarios">Usuários</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Detalhes</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Usuário</CardTitle>
            <CardDescription>Gerenciar informações do usuário</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>
                {error || 'Não foi possível carregar os detalhes do usuário'}
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button variant="outline" onClick={() => router.back()}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/configuracoes/usuarios">Usuários</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{user.name || user.email}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.name || 'Sem nome'}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar para Lista
        </Button>
      </div>

      {/* Formulário de edição */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Editar Usuário</CardTitle>
          <CardDescription>Edite as informações do usuário</CardDescription>
        </CardHeader>
        
        {success && (
          <CardContent>
            <Alert className="mb-4 bg-green-100 text-green-800 border-green-200">
              <AlertTitle>Sucesso!</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          </CardContent>
        )}
        
        {error && (
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        )}
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nome do usuário"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                value={formData.email}
                disabled
                className="bg-black-100"
              />
              <p className="text-xs text-gray-500">O email não pode ser alterado</p>
            </div>
            
            {/* Somente admins e owners podem alterar role */}
            {(userPermissions.role === 'admin' || userPermissions.role === 'owner') && (
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleSelectChange('role', value)}
                  disabled={user.role === 'owner' && userPermissions.role !== 'owner'}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    {/* Apenas owners podem ver e selecionar a opção owner */}
                    {userPermissions.role === 'owner' && (
                      <SelectItem value="owner">Proprietário</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {user.role === 'owner' && userPermissions.role !== 'owner' && (
                  <p className="text-xs text-amber-500">Somente proprietários podem modificar outros proprietários</p>
                )}
                {userPermissions.role === 'admin' && (
                  <p className="text-xs text-gray-500">Administradores só podem definir funções de Usuário ou Administrador</p>
                )}
              </div>
            )}
            
            {/* Somente admins e owners podem alterar status */}
            {(userPermissions.role === 'admin' || userPermissions.role === 'owner') && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                  disabled={user.role === 'owner' && userPermissions.role !== 'owner'}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit"
              disabled={saving || (user.role === 'owner' && userPermissions.role !== 'owner')}
              className="w-full sm:w-auto"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar Alterações
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 