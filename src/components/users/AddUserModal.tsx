'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Shield 
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PermissionGroup {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isCustom: boolean;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

export default function AddUserModal({ isOpen, onClose, onUserAdded }: AddUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    permissionGroupId: ''
  });
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [createdUser, setCreatedUser] = useState<{
    id: string;
    email: string;
    name: string;
    tempPassword: string;
  } | null>(null);

  // Carregar grupos de permissões
  useEffect(() => {
    if (isOpen) {
      fetchPermissionGroups();
    }
  }, [isOpen]);

  // Buscar grupos de permissões disponíveis
  const fetchPermissionGroups = async () => {
    setLoadingGroups(true);
    try {
      const response = await fetch('/api/permission-groups');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erro ${response.status}: Erro ao carregar grupos de permissões`);
      }

      setPermissionGroups(data.map((group: any) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        isDefault: group.isDefault,
        isCustom: group.isCustom
      })));
    } catch (err: any) {
      console.error('Erro ao buscar grupos de permissões:', err);
      setError(err.message || 'Ocorreu um erro ao buscar grupos de permissões');
    } finally {
      setLoadingGroups(false);
    }
  };

  // Funções de manipulação de formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setCreatedUser(null);

    try {
      // Validar form
      if (!formData.name.trim() || !formData.email.trim()) {
        throw new Error('Nome e email são obrigatórios');
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Email inválido');
      }

      // Enviar dados para a API
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário');
      }

      setSuccess('Usuário criado com sucesso');
      setCreatedUser(data.user);
      onUserAdded();
    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      setError(err.message || 'Ocorreu um erro ao criar o usuário');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFormData({
      name: '',
      email: '',
      role: 'user',
      permissionGroupId: ''
    });
    setError('');
    setSuccess('');
    setCreatedUser(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-[#1A1D24] border-gray-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Usuário</DialogTitle>
          <DialogDescription className="text-gray-400">
            Preencha os dados para criar um novo usuário
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="mb-4 bg-red-900/50 border-red-800 text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && !createdUser && (
          <Alert className="mb-4 bg-green-900/50 border-green-800 text-white">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Sucesso</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {createdUser ? (
          <div className="space-y-4">
            <div className="bg-[#0F1115] p-4 rounded-md border border-gray-800">
              <div className="grid grid-cols-5 gap-2 mb-2">
                <span className="text-sm font-medium text-gray-400 col-span-1">Nome:</span>
                <span className="text-sm col-span-4 text-white">{createdUser.name}</span>
              </div>
              <div className="grid grid-cols-5 gap-2 mb-2">
                <span className="text-sm font-medium text-gray-400 col-span-1">Email:</span>
                <span className="text-sm col-span-4 text-white">{createdUser.email}</span>
              </div>
              <div className="grid grid-cols-5 gap-2 mb-2">
                <span className="text-sm font-medium text-gray-400 col-span-1">Senha Temporária:</span>
                <span className="text-sm font-mono bg-[#2A2D34] px-2 rounded col-span-4 text-white">{createdUser.tempPassword}</span>
              </div>
            </div>
            <Alert className="bg-yellow-900/50 border-yellow-800 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Por razões de segurança, essa senha só é mostrada uma vez.
                O usuário deverá alterá-la após o primeiro acesso.
              </AlertDescription>
            </Alert>

            <DialogFooter className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => setCreatedUser(null)}
                className="bg-transparent border-gray-700 text-white hover:bg-[#2A2D34]"
              >
                Adicionar Outro Usuário
              </Button>
              <Button 
                onClick={handleClose}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Fechar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nome do usuário"
                  required
                  className="bg-[#0F1115] border-gray-800 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@exemplo.com"
                  required
                  className="bg-[#0F1115] border-gray-800 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-white">Função</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleSelectChange('role', value)}
                >
                  <SelectTrigger 
                    id="role"
                    className="bg-[#0F1115] border-gray-800 text-white"
                  >
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1D24] border-gray-800 text-white">
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="permissionGroup" className="text-white">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-blue-400" />
                    <span>Grupo de Permissões</span>
                  </div>
                </Label>
                {loadingGroups ? (
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Carregando grupos de permissões...</span>
                  </div>
                ) : (
                  <Select
                    value={formData.permissionGroupId}
                    onValueChange={(value) => handleSelectChange('permissionGroupId', value)}
                  >
                    <SelectTrigger 
                      id="permissionGroup"
                      className="bg-[#0F1115] border-gray-800 text-white"
                    >
                      <SelectValue placeholder="Selecione um grupo de permissões" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1D24] border-gray-800 text-white">
                      <SelectItem value="">Padrão (Baseado na função)</SelectItem>
                      {permissionGroups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-gray-400">
                  As permissões determinam quais recursos o usuário pode acessar no sistema.
                </p>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Adicionar Usuário
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 