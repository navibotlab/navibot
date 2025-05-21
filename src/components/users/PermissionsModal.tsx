'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, Save, Shield, ShieldCheck, SaveAll } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface PermissionGroup {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isCustom: boolean;
}

interface Permission {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  enabled: boolean;
}

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  permissions?: any[];
}

export default function PermissionsModal({ isOpen, onClose, userId, userName, permissions: initialPermissions = [] }: PermissionsModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('permissions');
  
  // Dados de permissões simplificados
  const [permissions, setPermissions] = useState<Record<string, Record<string, Permission[]>>>({});
  const [userRole, setUserRole] = useState('');
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  
  // Carregar dados do usuário e suas permissões
  useEffect(() => {
    if (isOpen && userId) {
      fetchUserPermissions();
    }
  }, [isOpen, userId]);

  // Buscar permissões do usuário
  const fetchUserPermissions = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/user/${userId}/permissions`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Erro ${response.status}: Erro ao carregar permissões`);
      }
      
      const data = await response.json();

      // Configurar dados do usuário
      setUserRole(data.role);
      
      // Configurar permissões do usuário
      if (data.permissions) {
        setUserPermissions(flattenPermissions(data.permissions));
      }

      // Organizar permissões por categoria e subcategoria
      const formattedPermissions: Record<string, Record<string, Permission[]>> = {};
      
      if (data.rawPermissions && data.rawPermissions.length > 0) {
        data.rawPermissions.forEach((perm: Permission) => {
          if (!formattedPermissions[perm.category]) {
            formattedPermissions[perm.category] = {};
          }
          
          const subCat = perm.subcategory || 'default';
          if (!formattedPermissions[perm.category][subCat]) {
            formattedPermissions[perm.category][subCat] = [];
          }
          
          formattedPermissions[perm.category][subCat].push(perm);
        });
      }
      
      setPermissions(formattedPermissions);
    } catch (err: any) {
      console.error('Erro ao buscar permissões:', err);
      setError(err.message || 'Ocorreu um erro ao buscar as permissões do usuário');
    } finally {
      setLoading(false);
    }
  };

  // Atualizar permissões do usuário
  const handleSavePermissions = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        permissions: unflattenPermissions(userPermissions)
      };

      const response = await fetch(`/api/user/${userId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Erro ${response.status}: Erro ao atualizar permissões`);
      }

      const data = await response.json();
      setSuccess('Permissões atualizadas com sucesso');
      
      // Atualizar interface com as novas permissões
      if (data.permissions) {
        setUserPermissions(flattenPermissions(data.permissions));
      }
      
      // Recarregar as permissões para atualizar a interface
      fetchUserPermissions();
    } catch (err: any) {
      console.error('Erro ao atualizar permissões:', err);
      setError(err.message || 'Ocorreu um erro ao atualizar as permissões');
    } finally {
      setSaving(false);
    }
  };

  // Toggle individual permission
  const handleTogglePermission = (permissionKey: string, enabled: boolean) => {
    setUserPermissions(prev => ({
      ...prev,
      [permissionKey]: enabled
    }));
  };

  // Toggle all permissions in a category
  const handleToggleCategory = (category: string, enabled: boolean) => {
    const newPermissions = { ...userPermissions };

    // Percorrer todas as subcategorias e permissões desta categoria
    Object.keys(permissions[category] || {}).forEach(subcat => {
      permissions[category][subcat].forEach(perm => {
        newPermissions[perm.key] = enabled;
      });
    });

    setUserPermissions(newPermissions);
  };

  // Função para verificar se todas as permissões de uma categoria estão habilitadas
  const isCategoryAllEnabled = (category: string): boolean => {
    const subcategories = permissions[category] || {};
    
    for (const subcat of Object.keys(subcategories)) {
      for (const perm of subcategories[subcat]) {
        if (!userPermissions[perm.key]) {
          return false;
        }
      }
    }
    
    return true;
  };

  // Função para verificar se alguma permissão de uma categoria está habilitada
  const isCategoryAnyEnabled = (category: string): boolean => {
    const subcategories = permissions[category] || {};
    
    for (const subcat of Object.keys(subcategories)) {
      for (const perm of subcategories[subcat]) {
        if (userPermissions[perm.key]) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Converter permissões aninhadas para uma estrutura plana
  const flattenPermissions = (obj: Record<string, any>, prefix = ''): Record<string, boolean> => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'boolean') {
        acc[newKey] = value;
      } else if (typeof value === 'object' && value !== null) {
        Object.assign(acc, flattenPermissions(value, newKey));
      }
      
      return acc;
    }, {} as Record<string, boolean>);
  };

  // Converter permissões planas para uma estrutura aninhada
  const unflattenPermissions = (flatPermissions: Record<string, boolean>) => {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(flatPermissions)) {
      const keys = key.split('.');
      let current = result;
      
      // Navegar/criar a estrutura aninhada
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!current[k]) current[k] = {};
        current = current[k];
      }
      
      // Definir o valor final
      current[keys[keys.length - 1]] = value;
    }
    
    return result;
  };

  // Verificar se o usuário é admin ou owner
  const isAdminOrOwner = userRole === 'admin' || userRole === 'owner';

  // Renderizar conteúdo do modal
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-slate-900 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl">Gerenciar Permissões</DialogTitle>
          <DialogDescription>
            Configurar permissões para o usuário {userName}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="bg-green-800 text-white border-green-700">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Sucesso</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="permissions" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="permissions" className="rounded-l-md">Permissões</TabsTrigger>
            <TabsTrigger value="accounts" className="rounded-none">Contas e Dispositivos</TabsTrigger>
            <TabsTrigger value="general" className="rounded-r-md">Geral</TabsTrigger>
          </TabsList>

          <TabsContent value="permissions" className="text-white">
            {isAdminOrOwner ? (
              <div className="p-4 mb-4 border border-slate-700 rounded-md bg-slate-800">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-indigo-400" />
                  <p className="text-lg font-semibold">Permissões de {userRole === 'admin' ? 'Administrador' : 'Proprietário'}</p>
                </div>
                <p className="mt-2 text-slate-400">
                  {userRole === 'admin' ? 'Administradores têm acesso a todas as funcionalidades do sistema.' : 'Proprietários têm acesso completo ao sistema.'}
                </p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-60">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              </div>
            ) : Object.keys(permissions).length === 0 ? (
              <div className="text-center py-8">
                <p>Nenhuma permissão disponível</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-400 mb-4">
                  Configure as permissões do usuário selecionando ou desativando as opções abaixo.
                </p>

                <Accordion type="multiple" className="space-y-4">
                  {Object.keys(permissions).map((category) => (
                    <AccordionItem 
                      key={category}
                      value={category}
                      className="border border-slate-700 rounded-md overflow-hidden"
                    >
                      <AccordionTrigger className="px-4 py-2 hover:bg-slate-800">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{category}</span>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`category-${category}`}
                              checked={isCategoryAllEnabled(category)}
                              onCheckedChange={(checked) => handleToggleCategory(category, checked)}
                              onClick={(e) => e.stopPropagation()}
                              className="data-[state=checked]:bg-indigo-600"
                            />
                            <Label htmlFor={`category-${category}`} onClick={(e) => e.stopPropagation()}>
                              {isCategoryAllEnabled(category) ? 'Todas ativas' : isCategoryAnyEnabled(category) ? 'Algumas ativas' : 'Todas inativas'}
                            </Label>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 py-2 bg-slate-800">
                        {Object.keys(permissions[category]).map((subcategory) => (
                          <div key={`${category}-${subcategory}`} className="mb-4">
                            {subcategory !== 'default' && (
                              <h4 className="text-sm font-medium text-slate-400 mb-2">{subcategory}</h4>
                            )}
                            <div className="space-y-2">
                              {permissions[category][subcategory].map((permission) => (
                                <div key={permission.id} className="flex items-center justify-between">
                                  <div>
                                    <Label htmlFor={permission.id} className="text-sm font-medium">
                                      {permission.name}
                                    </Label>
                                    {permission.description && (
                                      <p className="text-xs text-slate-400">{permission.description}</p>
                                    )}
                                  </div>
                                  <Switch
                                    id={permission.id}
                                    checked={!!userPermissions[permission.key]}
                                    onCheckedChange={(checked) => handleTogglePermission(permission.key, checked)}
                                    className="data-[state=checked]:bg-indigo-600"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </TabsContent>

          <TabsContent value="accounts" className="text-white">
            <div className="text-center py-8">
              <p>Conteúdo de contas e dispositivos em desenvolvimento</p>
            </div>
          </TabsContent>

          <TabsContent value="general" className="text-white">
            <div className="text-center py-8">
              <p>Conteúdo geral em desenvolvimento</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col mt-4">
          <p className="text-sm text-slate-400 mb-2">Função do usuário: {userRole === 'admin' ? 'Administrador' : userRole === 'owner' ? 'Proprietário' : 'Usuário'}</p>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          
          {!isAdminOrOwner && (
            <Button 
              onClick={handleSavePermissions} 
              disabled={saving || loading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Permissões
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 