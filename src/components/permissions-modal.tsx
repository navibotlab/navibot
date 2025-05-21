import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

export interface Permission {
  id: string
  name: string
  description: string
  module: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
  permissions: string[]
}

interface PermissionsModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
}

const mockPermissions: Permission[] = [
  { id: 'view_dashboard', name: 'Ver Dashboard', description: 'Visualizar estatísticas e gráficos', module: 'Dashboard' },
  { id: 'manage_bots', name: 'Gerenciar Bots', description: 'Criar, editar e excluir bots', module: 'Bots' },
  { id: 'view_bots', name: 'Visualizar Bots', description: 'Ver lista de bots e detalhes', module: 'Bots' },
  { id: 'manage_users', name: 'Gerenciar Usuários', description: 'Criar, editar e excluir usuários', module: 'Usuários' },
  { id: 'view_users', name: 'Visualizar Usuários', description: 'Ver lista de usuários', module: 'Usuários' },
  { id: 'manage_logs', name: 'Gerenciar Logs', description: 'Visualizar e exportar logs', module: 'Logs' },
  { id: 'manage_settings', name: 'Gerenciar Configurações', description: 'Alterar configurações do sistema', module: 'Configurações' }
]

const PermissionsModal = ({ isOpen, onClose, user }: PermissionsModalProps) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(user?.permissions || [])
  const [activeTab, setActiveTab] = useState('Dashboard')
  
  const modules = Array.from(new Set(mockPermissions.map(p => p.module)))
  
  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }
  
  const handleSave = () => {
    if (!user) return
    
    // Aqui você faria uma chamada API para salvar as permissões
    console.log('Salvando permissões para', user.name, selectedPermissions)
    
    toast.success('Permissões atualizadas com sucesso!')
    onClose()
  }
  
  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Permissões de Usuário - {user.name}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              {modules.map(module => (
                <TabsTrigger key={module} value={module}>
                  {module}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {modules.map(module => (
              <TabsContent key={module} value={module}>
                <div className="grid gap-4">
                  {mockPermissions
                    .filter(permission => permission.module === module)
                    .map(permission => (
                      <div key={permission.id} className="flex items-start space-x-3 p-2 rounded hover:bg-muted">
                        <Checkbox 
                          id={permission.id}
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={() => handleTogglePermission(permission.id)}
                        />
                        <div>
                          <Label htmlFor={permission.id} className="font-medium">
                            {permission.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PermissionsModal 