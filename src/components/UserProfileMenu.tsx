'use client';

import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, Settings } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface UserPermissions {
  role: string;
  permissions: {
    users: {
      view: boolean;
      create: boolean;
      update: boolean;
      delete: boolean;
    };
    [key: string]: any;
  };
}

export function UserProfileMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar permissões do usuário
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetch('/api/user/me/permissions')
        .then(res => res.json())
        .then(data => {
          setPermissions(data);
          setIsAdmin(data.role === 'admin');
          setIsOwner(data.role === 'owner');
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Erro ao carregar permissões:', err);
          setIsLoading(false);
        });
    }
  }, [status, session]);

  // Se não estiver autenticado, não renderiza nada
  if (status !== 'authenticated' || !session?.user) {
    return null;
  }

  const userData = session.user;

  // Função para fazer logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut({ 
        callbackUrl: '/login',
        redirect: true
      });
      
      // Forçar limpeza do localStorage e sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Forçar revalidação da rota
      router.refresh();
      
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      setIsLoggingOut(false);
    }
  };

  // Navegar para as configurações de conta
  const handleManageAccount = () => {
    router.push('/admin/configuracoes/conta');
    setIsOpen(false);
  };

  // Determina o que exibir como nome principal
  const displayName = userData.name || userData.email?.split('@')[0] || '';
  
  // Determina a primeira letra para o avatar fallback
  const avatarInitial = displayName ? displayName.charAt(0).toUpperCase() : '?';

  return (
    <div className="flex items-center">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-gray-800 transition-colors">
            <Avatar className="h-8 w-8 border border-gray-700">
              <AvatarImage src={userData.image || ''} />
              <AvatarFallback className="bg-gray-700 text-white">
                {avatarInitial}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <span className="text-sm font-medium text-white">{displayName}</span>
              {userData.name && (
                <span className="text-xs text-gray-400">{userData.email}</span>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-[#1C1F26] border-gray-800 text-white">
          <div className="flex items-center justify-start p-2">
            <Avatar className="h-10 w-10 mr-2">
              <AvatarImage src={userData.image || ''} />
              <AvatarFallback className="bg-gray-700 text-white">
                {avatarInitial}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1 leading-none text-left">
              <p className="font-medium text-sm">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {isOwner 
                  ? 'Proprietário' 
                  : isAdmin 
                    ? 'Administrador' 
                    : 'Usuário'}
              </p>
            </div>
          </div>
          <DropdownMenuSeparator className="bg-gray-800" />
          <DropdownMenuItem 
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-800"
            onClick={handleManageAccount}
          >
            <Settings className="h-4 w-4" />
            <span>Gerenciar conta</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-gray-800" />
          <DropdownMenuItem 
            className="flex items-center gap-2 cursor-pointer text-red-500 hover:bg-gray-800 hover:text-red-400"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-4 w-4" />
            <span>{isLoggingOut ? 'Saindo...' : 'Sair da conta'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 