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
  ShieldCheck, 
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
  Crown,
  ArrowUpDown,
  MoreHorizontal,
  Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import AddUserModal from '@/components/users/AddUserModal';
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  isEmbedded?: boolean;
}

export default function UsersPage({ isEmbedded = false }: Props) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
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
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Carregar lista de usuários
  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchUsers();
      // Buscar a role do usuário autenticado
      fetchCurrentUserRole();
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

  // Função para buscar a role do usuário autenticado
  const fetchCurrentUserRole = async () => {
    try {
      const response = await fetch('/api/user/me/permissions');
      const data = await response.json();
      
      if (response.ok && data && typeof data.role === 'string') {
        setCurrentUserRole(data.role);
      }
    } catch (err) {
      console.error('Erro ao buscar permissões do usuário:', err);
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
      const response = await fetch(`/api/user?id=${deleteDialog.userId}`, {
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
      const response = await fetch(`/api/user?id=${statusDialog.userId}`, {
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
      const response = await fetch(`/api/user?id=${roleDialog.userId}`, {
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

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Atualizar lista após adicionar um usuário
  const handleUserAdded = () => {
    fetchUsers();
  };

  const handleOpenPermissions = (user: User) => {
    router.push(`/admin/configuracoes/usuarios/${user.id}/permissoes`);
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nome
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Função",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div className={`px-2 py-1 rounded-full text-xs inline-block ${
            status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {status === 'active' ? 'Ativo' : 'Inativo'}
          </div>
        )
      }
    },
    {
      accessorKey: "createdAt",
      header: "Data de Criação",
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/admin/configuracoes/usuarios/${user.id}`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setRoleDialog({
                  isOpen: true,
                  userId: user.id,
                  userName: user.name || user.email,
                  currentRole: user.role,
                  newRole: user.role === 'admin' ? 'user' : 'admin'
                })}
              >
                <Shield className="mr-2 h-4 w-4" />
                {user.role === 'admin' ? 'Rebaixar para Usuário' : 'Promover a Admin'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenPermissions(user)}>
                <Shield className="mr-2 h-4 w-4" />
                Permissões
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setStatusDialog({
                  isOpen: true,
                  userId: user.id,
                  userName: user.name || user.email,
                  currentStatus: user.status,
                  newStatus: user.status === 'active' ? 'inactive' : 'active'
                })}
              >
                <UserX className="mr-2 h-4 w-4" />
                {user.status === 'active' ? 'Desativar Usuário' : 'Ativar Usuário'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setDeleteDialog({
                  isOpen: true,
                  userId: user.id,
                  userName: user.name || user.email
                })}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ];

  // Mostrar loading enquanto carrega a sessão
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Redirecionar se não estiver autenticado ou não for admin
  if (status === 'unauthenticated' && !isEmbedded) {
    router.push('/login');
    return null;
  }

  return (
    <div className={isEmbedded ? "" : "container py-6"}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Gerenciamento de Usuários</h1>
        <Button 
          onClick={() => setAddUserModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar Usuário
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>Gerencie os usuários do seu workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou email"
                className="pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <DataTable columns={columns} data={users} loading={loading} />
          </div>
        </CardContent>
        
        {/* Paginação */}
        {users.length > 0 && (
          <CardFooter className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Mostrando {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} usuários
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm mx-2">
                Página {pagination.page} de {pagination.pages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Você está prestes a excluir o usuário <strong>{deleteDialog.userName}</strong>. Esta ação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ isOpen: false, userId: '', userName: '' })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar status do usuário</DialogTitle>
            <DialogDescription>
              {statusDialog.newStatus === 'active' 
                ? `Você está ativando o usuário ${statusDialog.userName}.` 
                : `Você está desativando o usuário ${statusDialog.userName}.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog({ isOpen: false, userId: '', userName: '', currentStatus: '', newStatus: '' })}>
              Cancelar
            </Button>
            <Button variant={statusDialog.newStatus === 'active' ? 'default' : 'secondary'} onClick={handleChangeStatus}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar função do usuário</DialogTitle>
            <DialogDescription>
              {roleDialog.newRole === 'admin' 
                ? `Você está promovendo ${roleDialog.userName} para Administrador.` 
                : `Você está alterando ${roleDialog.userName} para Usuário regular.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog({ isOpen: false, userId: '', userName: '', currentRole: '', newRole: '' })}>
              Cancelar
            </Button>
            <Button onClick={handleChangeRole}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de adicionar usuário */}
      <AddUserModal 
        isOpen={addUserModalOpen} 
        onClose={() => setAddUserModalOpen(false)} 
        onUserAdded={handleUserAdded} 
      />
    </div>
  );
} 