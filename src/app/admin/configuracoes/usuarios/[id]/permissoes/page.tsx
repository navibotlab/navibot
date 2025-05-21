'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Loader2, AlertCircle, Save, Shield, ShieldCheck, ArrowLeft } from 'lucide-react';

interface Permission {
  key: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  enabled?: boolean;
}

interface PermissionCategory {
  [subcategory: string]: Permission[];
}

interface PermissionStructure {
  [category: string]: PermissionCategory;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: Record<string, any>;
}

interface ApiResponse {
  error?: string;
  user?: User;
  message?: string;
}

interface UserPageProps {
  params: {
    id: string;
  };
}

interface UserPermissions {
  [key: string]: boolean;
}

export default function UserPermissionsPage({ params }: UserPageProps) {
  const router = useRouter();
  const userId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('permissions');
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Record<string, Record<string, Permission[]>>>({});
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  
  // Efeito para recarregar permissões quando necessário
  useEffect(() => {
    if (userId) {
      fetchUserData();
      fetchUserPermissions();
    }
  }, [userId]);

  // Efeito para mostrar feedback visual quando as permissões são alteradas
  useEffect(() => {
    console.log('Estado atual das permissões:', userPermissions);
  }, [userPermissions]);

  // Função para recarregar permissões
  const reloadPermissions = async () => {
    setLoading(true);
    try {
      await fetchUserPermissions();
    } catch (err) {
      console.error('Erro ao recarregar permissões:', err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar dados do usuário
  const fetchUserData = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/user/${userId}`);
      
      if (!response.ok) {
        const data: ApiResponse = await response.json();
        throw new Error(data.error || `Erro ${response.status}: Erro ao carregar dados do usuário`);
      }
      
      const userData = await response.json();
      // Aqui a resposta é o usuário diretamente, não um objeto com campo 'user'
      setUser(userData);
    } catch (err: any) {
      console.error('Erro ao buscar dados do usuário:', err);
      setError(err.message || 'Ocorreu um erro ao buscar os dados do usuário');
    }
  };

  // Buscar permissões do usuário
  const fetchUserPermissions = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/user/${userId}/permissions`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Erro ${response.status}: Erro ao carregar permissões`);
      }
      
      console.log('Permissões recebidas:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Atualizar o estado com as novas permissões
      if (data.permissions) {
        setUserPermissions(flattenPermissions(data.permissions));
      }

      // Atualizar o estado do usuário se necessário
      if (data.user) {
        setUser(data.user);
      }

      // Atualizar as permissões disponíveis se fornecidas
      if (data.rawPermissions) {
        const formattedPermissions: Record<string, Record<string, Permission[]>> = {};
        
        data.rawPermissions.forEach((perm: Permission) => {
          if (!formattedPermissions[perm.category]) {
            formattedPermissions[perm.category] = {};
          }
          
          const subCat = perm.subcategory || 'default';
          if (!formattedPermissions[perm.category][subCat]) {
            formattedPermissions[perm.category][subCat] = [];
          }
          
          formattedPermissions[perm.category][subCat].push({
            ...perm,
            enabled: data.permissions ? isPermissionEnabled(perm.key, data.permissions) : false
          });
        });
        
        setPermissions(formattedPermissions);
      }
      
      setSuccess(data.message || 'Permissões atualizadas com sucesso');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error('Erro ao buscar permissões:', err);
      setError(err.message || 'Ocorreu um erro ao buscar as permissões do usuário');
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para verificar se uma permissão está habilitada
  const isPermissionEnabled = (permissionKey: string, permissions: any): boolean => {
    const keys = permissionKey.split('.');
    let current = permissions;
    
    for (const key of keys) {
      if (!current || typeof current !== 'object') return false;
      current = current[key];
    }
    
    return current === true;
  };

  // Atualizar permissões do usuário
  const handleSavePermissions = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/user/${userId}/permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: unflattenPermissions(userPermissions)
        }),
      });

      if (!response.ok) {
        const data: ApiResponse = await response.json();
        throw new Error(data.error || `Erro ${response.status}: Erro ao salvar permissões`);
      }

      setSuccess('Permissões atualizadas com sucesso!');
    } catch (err: any) {
      console.error('Erro ao salvar permissões:', err);
      setError(err.message || 'Ocorreu um erro ao salvar as permissões');
    } finally {
      setSaving(false);
    }
  };

  // Toggle individual permission
  const handleTogglePermission = (key: string, enabled: boolean): void => {
    setUserPermissions(prevPermissions => ({
      ...prevPermissions,
      [key]: enabled
    }));
  };

  // Toggle all permissions in a category
  const handleToggleCategory = (category: string, enabled: boolean): void => {
    setUserPermissions(prevPermissions => {
      const newPermissions = { ...prevPermissions };
      
      Object.keys(permissions[category] || {}).forEach(subcategory => {
        permissions[category][subcategory].forEach(permission => {
          newPermissions[permission.key] = enabled;
        });
      });
      
      return newPermissions;
    });
  };

  // Função para verificar se todas as permissões de uma categoria estão habilitadas
  const isCategoryAllEnabled = (category: string): boolean => {
    let allEnabled = true;
    
    Object.keys(permissions[category] || {}).forEach(subcategory => {
      permissions[category][subcategory].forEach(permission => {
        if (!userPermissions[permission.key]) {
          allEnabled = false;
        }
      });
    });
    
    return allEnabled;
  };

  // Função para verificar se alguma permissão de uma categoria está habilitada
  const isCategoryAnyEnabled = (category: string): boolean => {
    let anyEnabled = false;
    
    Object.keys(permissions[category] || {}).forEach(subcategory => {
      permissions[category][subcategory].forEach(permission => {
        if (userPermissions[permission.key]) {
          anyEnabled = true;
        }
      });
    });
    
    return anyEnabled;
  };

  // Renderizar os toggles de permissão
  const renderPermissionToggles = (permission: Permission) => {
    const isEnabled = !!userPermissions[permission.key];
    console.log('Renderizando toggle:', permission.key, isEnabled);
    
    return (
      <div key={permission.key} className="flex items-center justify-between">
        <div>
          <Label htmlFor={permission.key} className="text-sm font-medium">
            {permission.name}
          </Label>
          {permission.description && (
            <p className="text-xs text-slate-400">{permission.description}</p>
          )}
        </div>
        <Switch
          id={permission.key}
          checked={isEnabled}
          onCheckedChange={(checked) => handleTogglePermission(permission.key, checked)}
          className="data-[state=checked]:bg-indigo-600"
        />
      </div>
    );
  };

  // Converter permissões aninhadas para uma estrutura plana
  const flattenPermissions = (obj: Record<string, any>, prefix = ''): Record<string, boolean> => {
    return Object.keys(obj).reduce((acc: Record<string, boolean>, key: string) => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        Object.assign(acc, flattenPermissions(value, newKey));
      } else {
        acc[newKey] = Boolean(value);
      }
      
      return acc;
    }, {});
  };

  // Converter permissões planas para uma estrutura aninhada
  const unflattenPermissions = (flatPermissions: Record<string, boolean>): Record<string, any> => {
    const result: Record<string, any> = {};
    
    Object.entries(flatPermissions).forEach(([key, value]) => {
      const parts = key.split('.');
      let current = result;
      
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = value;
        } else {
          current[part] = current[part] || {};
          current = current[part];
        }
      });
    });
    
    return result;
  };

  // Verificar se o usuário é admin ou owner
  const isAdminOrOwner = user?.role === 'admin' || user?.role === 'owner';

  // Renderizar página
  return (
    <div className="container py-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/configuracoes">Configurações</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/configuracoes/usuarios">Usuários</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Permissões</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-white">
            Gerenciar Permissões do Usuário
          </h1>
        </div>
        
        {!isAdminOrOwner && (
          <Button 
            onClick={handleSavePermissions} 
            disabled={saving || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
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
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="default" className="mb-6 bg-green-800 text-white border-green-700">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Sucesso</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informações do Usuário</CardTitle>
          <CardDescription>Detalhes do usuário e suas permissões</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : user ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Nome</p>
                <p className="text-lg">{user.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-lg">{user.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Função</p>
                <p className="text-lg">{user.role === 'admin' ? 'Administrador' : user.role === 'owner' ? 'Proprietário' : 'Usuário'}</p>
              </div>
            </div>
          ) : (
            <p>Usuário não encontrado</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Permissões</CardTitle>
          <CardDescription>Configure as permissões do usuário</CardDescription>
        </CardHeader>
        <CardContent>
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
                    <p className="text-lg font-semibold">Permissões de {user?.role === 'admin' ? 'Administrador' : 'Proprietário'}</p>
                  </div>
                  <p className="mt-2 text-slate-400">
                    {user?.role === 'admin' ? 'Administradores têm acesso a todas as funcionalidades do sistema.' : 'Proprietários têm acesso completo ao sistema.'}
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
                                {permissions[category][subcategory].map((permission) => renderPermissionToggles(permission))}
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
        </CardContent>
        {!isAdminOrOwner && (
          <CardFooter>
            <Button 
              onClick={handleSavePermissions} 
              disabled={saving || loading}
              className="bg-indigo-600 hover:bg-indigo-700 w-full"
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
          </CardFooter>
        )}
      </Card>
    </div>
  );
} 