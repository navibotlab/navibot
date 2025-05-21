'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  AlertCircle, 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  ShieldAlert,
  UserX,
  MoreVertical,
  Crown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface UsersManagementProps {
  isEmbedded?: boolean;
}

export default function UsersManagement({ isEmbedded = false }: UsersManagementProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    userId: '',
    userName: ''
  });
  const [statusDialog, setStatusDialog] = useState({
    isOpen: false,
    userId: '',
    userName: '',
    currentStatus: '',
    newStatus: ''
  });
  const [roleDialog, setRoleDialog] = useState({
    isOpen: false,
    userId: '',
    userName: '',
    currentRole: '',
    newRole: ''
  });

  // Carregar lista de usuários
  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchUsers();
    }
  }, [status, session, pagination.page, searchTerm]);

  // Função para buscar usuários com paginação e pesquisa
  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

      const response = await fetch(`/api/user?${queryParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar usuários');
      }

      setUsers(data.users || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 1
      }));
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err);
      setError(err.message || 'Ocorreu um erro ao buscar os usuários');
    } finally {
      setLoading(false);
    }
  };

  // Função para lidar com mudanças na pesquisa
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Resetar para a primeira página ao pesquisar
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Função para mudar de página na paginação
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Função para excluir um usuário
  const handleDeleteUser = async () => {
    try {
      const response = await fetch(`/api/user/${deleteDialog.userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir usuário');
      }

      // Atualizar a lista após exclusão
      fetchUsers();
      setDeleteDialog({ isOpen: false, userId: '', userName: '' });
    } catch (err: any) {
      console.error('Erro ao excluir usuário:', err);
      setError(err.message || 'Ocorreu um erro ao excluir o usuário');
    }
  };

  // Função para alterar o status de um usuário
  const handleChangeStatus = async () => {
    try {
      const response = await fetch(`/api/user/${statusDialog.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: statusDialog.newStatus
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao alterar status do usuário');
      }

      // Atualizar a lista após mudança
      fetchUsers();
      setStatusDialog({ isOpen: false, userId: '', userName: '', currentStatus: '', newStatus: '' });
    } catch (err: any) {
      console.error('Erro ao alterar status do usuário:', err);
      setError(err.message || 'Ocorreu um erro ao alterar o status do usuário');
    }
  };

  // Função para alterar a role de um usuário
  const handleChangeRole = async () => {
    try {
      const response = await fetch(`/api/user/${roleDialog.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: roleDialog.newRole
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao alterar função do usuário');
      }

      // Atualizar a lista após mudança
      fetchUsers();
      setRoleDialog({ isOpen: false, userId: '', userName: '', currentRole: '', newRole: '' });
    } catch (err: any) {
      console.error('Erro ao alterar função do usuário:', err);
      setError(err.message || 'Ocorreu um erro ao alterar a função do usuário');
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

  // Verificar autenticação
  if (status === 'loading' && !isEmbedded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Redirecionar se não estiver autenticado (apenas quando não estiver incorporado)
  if (status === 'unauthenticated' && !isEmbedded) {
    router.push('/login');
    return null;
  }

  // Se estiver incorporado, não exibe o cabeçalho da página
  const headerSection = !isEmbedded ? (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-white">Gerenciamento de Usuários</h1>
      <Button 
        onClick={() => router.push('/admin/configuracoes/usuarios/novo')}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Adicionar Usuário
      </Button>
    </div>
  ) : (
    <div className="flex justify-between items-center mb-6">
      <div>
        <p className="text-gray-400 mb-4">
          Aqui você pode adicionar e editar os usuários.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-400">
          Assentos ativos: <span className="font-semibold text-white">5/8</span>
        </div>
        <Button 
          onClick={() => router.push('/admin/configuracoes/usuarios/novo')}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar Usuário
        </Button>
      </div>
    </div>
  );

  return (
    <div className={isEmbedded ? "" : "container py-6"}>
      {headerSection}
      
      {error && (
        <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-800 text-white">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6 bg-[#0F1115] border-gray-800 text-white">
        {!isEmbedded && (
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
            <CardDescription className="text-gray-400">Gerencie os usuários do seu workspace</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou email"
                className="pl-8 bg-[#1A1D24] border-gray-800 text-white"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>

          {isEmbedded ? (
            // Interface de lista para modo incorporado
            <div>
              {loading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  Nenhum usuário encontrado.
                </div>
              ) : (
                <div>
                  {users.map((user) => (
                    <div 
                      key={user.id} 
                      className="border-t border-gray-800 px-6 py-4 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="mr-3 h-4 w-4 rounded border-gray-700 bg-[#1A1D24]"
                        />
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium mr-3">
                            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white">{user.name || user.email.split('@')[0]}</div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 text-sm bg-[#1A1D24] rounded text-gray-300">
                          {user.role === 'admin' 
                            ? 'Administrador' 
                            : user.role === 'owner' 
                              ? 'Proprietário' 
                              : 'Usuário'}
                        </div>
                        <Badge
                          className={`
                            ${user.status === 'active' ? 'bg-green-500' : 
                             user.status === 'pending' ? 'bg-yellow-500' : 
                             'bg-gray-500'}
                          `}
                        >
                          {user.status === 'active' ? 'Ativo' : 
                           user.status === 'pending' ? 'Pendente' : 'Inativo'}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1A1D24]">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#1A1D24] border-gray-800 text-white">
                            {user.role === 'owner' ? (
                              <DropdownMenuItem
                                className="text-gray-400 hover:bg-[#2A2D34] cursor-not-allowed opacity-70"
                              >
                                <Crown className="h-4 w-4 mr-2" />
                                Proprietário do sistema (não editável)
                              </DropdownMenuItem>
                            ) : (
                              <>
                                <DropdownMenuItem 
                                  className="hover:bg-[#2A2D34]"
                                  onClick={() => router.push(`/admin/configuracoes/usuarios/${user.id}`)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="hover:bg-[#2A2D34]"
                                  onClick={() => setRoleDialog({
                                    isOpen: true,
                                    userId: user.id,
                                    userName: user.name || user.email,
                                    currentRole: user.role,
                                    newRole: user.role === 'admin' 
                                      ? 'user' 
                                      : user.role === 'user' 
                                        ? 'admin' 
                                        : 'admin'
                                  })}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  {user.role === 'admin' 
                                    ? 'Rebaixar para Usuário' 
                                    : user.role === 'user' 
                                      ? 'Promover a Admin' 
                                      : 'Alterar função'}
                                </DropdownMenuItem>
                                
                                {/* Opção de promover a proprietário - apenas para admins */}
                                {user.role !== 'owner' && (
                                  <DropdownMenuItem 
                                    className="hover:bg-[#2A2D34]"
                                    onClick={() => setRoleDialog({
                                      isOpen: true,
                                      userId: user.id,
                                      userName: user.name || user.email,
                                      currentRole: user.role,
                                      newRole: 'owner'
                                    })}
                                  >
                                    <Crown className="h-4 w-4 mr-2" />
                                    Promover a Proprietário
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  className="hover:bg-[#2A2D34]"
                                  onClick={() => setStatusDialog({
                                    isOpen: true,
                                    userId: user.id,
                                    userName: user.name || user.email,
                                    currentStatus: user.status,
                                    newStatus: user.status === 'active' ? 'inactive' : 'active'
                                  })}
                                >
                                  {user.status === 'active' ? 
                                    <UserX className="h-4 w-4 mr-2" /> : 
                                    <Shield className="h-4 w-4 mr-2" />
                                  }
                                  {user.status === 'active' ? 'Desativar' : 'Ativar'}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-400 hover:bg-[#2A2D34] hover:text-red-400"
                                  onClick={() => setDeleteDialog({
                                    isOpen: true,
                                    userId: user.id,
                                    userName: user.name || user.email
                                  })}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Interface de tabela para modo standalone
            <div className="rounded-md border border-gray-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-[#1A1D24]">
                    <TableHead className="w-[250px] text-gray-400">Nome / Email</TableHead>
                    <TableHead className="text-gray-400">Função</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Criado em</TableHead>
                    <TableHead className="text-right text-gray-400">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow className="border-gray-800 hover:bg-[#1A1D24]">
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow className="border-gray-800 hover:bg-[#1A1D24]">
                      <TableCell colSpan={5} className="h-24 text-center text-gray-400">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id} className="border-gray-800 hover:bg-[#1A1D24]">
                        <TableCell className="font-medium">
                          <div>
                            <div className="text-white">{user.name || 'Sem nome'}</div>
                            <div className="text-xs text-gray-400">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`${
                              user.role === 'admin' 
                                ? 'bg-blue-600 text-white' 
                                : user.role === 'owner'
                                  ? 'bg-purple-600 text-white' 
                                  : 'bg-[#1A1D24] text-gray-300'
                            }`}
                          >
                            {user.role === 'admin' 
                              ? 'Administrador' 
                              : user.role === 'owner' 
                                ? 'Proprietário' 
                                : 'Usuário'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`
                              ${user.status === 'active' ? 'bg-green-500 text-white' : 
                               user.status === 'pending' ? 'bg-yellow-500 text-white' : 
                               'bg-gray-500 text-white'}
                            `}
                          >
                            {user.status === 'active' ? 'Ativo' : 
                             user.status === 'pending' ? 'Pendente' : 
                             user.status === 'inactive' ? 'Inativo' : 'Bloqueado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-[#1A1D24]">
                                <span className="sr-only">Abrir menu</span>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1A1D24] border-gray-800 text-white">
                              {user.role === 'owner' ? (
                                <DropdownMenuItem
                                  className="text-gray-400 hover:bg-[#2A2D34] cursor-not-allowed opacity-70"
                                >
                                  <Crown className="h-4 w-4 mr-2" />
                                  Proprietário do sistema (não editável)
                                </DropdownMenuItem>
                              ) : (
                                <>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/configuracoes/usuarios/${user.id}`}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar
                                    </Link>
                                  </DropdownMenuItem>
                                  
                                  {/* Alterar Função */}
                                  <DropdownMenuItem
                                    className="hover:bg-[#2A2D34]"
                                    onClick={() => setRoleDialog({
                                      isOpen: true,
                                      userId: user.id,
                                      userName: user.name || user.email,
                                      currentRole: user.role,
                                      newRole: user.role === 'admin' 
                                        ? 'user' 
                                        : user.role === 'user' 
                                          ? 'admin' 
                                          : 'admin'
                                    })}
                                  >
                                    <Shield className="h-4 w-4 mr-2" />
                                    {user.role === 'admin' 
                                      ? 'Rebaixar para Usuário' 
                                      : user.role === 'user' 
                                        ? 'Promover a Admin' 
                                        : 'Alterar função'}
                                  </DropdownMenuItem>
                                  
                                  {/* Opção de promover a proprietário - apenas para admins */}
                                  {user.role !== 'owner' && (
                                    <DropdownMenuItem
                                      className="hover:bg-[#2A2D34]"
                                      onClick={() => setRoleDialog({
                                        isOpen: true,
                                        userId: user.id,
                                        userName: user.name || user.email,
                                        currentRole: user.role,
                                        newRole: 'owner'
                                      })}
                                    >
                                      <Crown className="h-4 w-4 mr-2" />
                                      Promover a Proprietário
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {/* Alterar Status */}
                                  {user.status === 'active' ? (
                                    <DropdownMenuItem
                                      className="hover:bg-[#2A2D34]"
                                      onClick={() => setStatusDialog({
                                        isOpen: true,
                                        userId: user.id,
                                        userName: user.name || user.email,
                                        currentStatus: user.status,
                                        newStatus: 'inactive'
                                      })}
                                    >
                                      <UserX className="h-4 w-4 mr-2" />
                                      Desativar Usuário
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      className="hover:bg-[#2A2D34]"
                                      onClick={() => setStatusDialog({
                                        isOpen: true,
                                        userId: user.id,
                                        userName: user.name || user.email,
                                        currentStatus: user.status,
                                        newStatus: 'active'
                                      })}
                                    >
                                      <Shield className="h-4 w-4 mr-2" />
                                      Ativar Usuário
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {/* Excluir */}
                                  <DropdownMenuItem
                                    className="text-red-400 hover:bg-[#2A2D34] hover:text-red-400"
                                    onClick={() => setDeleteDialog({
                                      isOpen: true,
                                      userId: user.id,
                                      userName: user.name || user.email
                                    })}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        
        {/* Paginação - mostrar apenas se tiver usuários */}
        {users.length > 0 && (
          <CardFooter className="flex items-center justify-between border-t border-gray-800">
            <div className="text-sm text-gray-400">
              Mostrando {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} usuários
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="bg-transparent border-gray-700 text-white hover:bg-[#1A1D24] hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm mx-2 text-gray-400">
                Página {pagination.page} de {pagination.pages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="bg-transparent border-gray-700 text-white hover:bg-[#1A1D24] hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog 
        open={deleteDialog.isOpen} 
        onOpenChange={(open) => !open && setDeleteDialog(prev => ({ ...prev, isOpen: false }))}
      >
        <DialogContent className="bg-[#1A1D24] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription className="text-gray-400">
              Você está prestes a excluir o usuário <strong className="text-white">{deleteDialog.userName}</strong>. Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ isOpen: false, userId: '', userName: '' })}
              className="bg-transparent border-gray-700 text-white hover:bg-[#2A2D34]"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de alteração de status */}
      <Dialog 
        open={statusDialog.isOpen} 
        onOpenChange={(open) => !open && setStatusDialog(prev => ({ ...prev, isOpen: false }))}
      >
        <DialogContent className="bg-[#1A1D24] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Alterar status do usuário</DialogTitle>
            <DialogDescription className="text-gray-400">
              {statusDialog.newStatus === 'active' 
                ? `Você está ativando o usuário ${statusDialog.userName}.` 
                : `Você está desativando o usuário ${statusDialog.userName}.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setStatusDialog({ isOpen: false, userId: '', userName: '', currentStatus: '', newStatus: '' })}
              className="bg-transparent border-gray-700 text-white hover:bg-[#2A2D34]"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleChangeStatus}
              className={statusDialog.newStatus === 'active' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'}
            >
              {statusDialog.newStatus === 'active' ? 'Ativar' : 'Desativar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de alteração de role */}
      <Dialog 
        open={roleDialog.isOpen} 
        onOpenChange={(open) => !open && setRoleDialog(prev => ({ ...prev, isOpen: false }))}
      >
        <DialogContent className="bg-[#1A1D24] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Alterar função do usuário</DialogTitle>
            <DialogDescription className="text-gray-400">
              {roleDialog.newRole === 'admin' 
                ? `Você está promovendo ${roleDialog.userName} para Administrador.` 
                : `Você está alterando ${roleDialog.userName} para Usuário regular.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRoleDialog({ isOpen: false, userId: '', userName: '', currentRole: '', newRole: '' })}
              className="bg-transparent border-gray-700 text-white hover:bg-[#2A2D34]"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleChangeRole}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 