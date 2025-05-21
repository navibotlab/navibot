'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, UserCircle, Plus, Upload, Filter, Search, RotateCw, Download, Play } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CreateLeadDialog } from './components/CreateLeadDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Tutorial from './components/Tutorial';
import { EditLeadDialog } from './components/EditLeadDialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatPhone } from "@/lib/utils/format";

interface Lead {
  id: string;
  name: string | null;
  phone: string;
  photo: string | null;
  createdAt: string;
  updatedAt: string;
  labels: {
    id: string;
    name: string;
    color: string;
  }[];
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { toast } = useToast();

  // Buscar leads
  const fetchLeads = async () => {
    if (isRefreshing) return; // Evitar chamadas simultâneas
    
    try {
      setIsLoading(true);
      
      // Usar os headers padrão da aplicação
      const headers = {
        'x-workspace-id': 'ws_default', // Este valor deve vir da configuração ou contexto da aplicação 
        'Content-Type': 'application/json'
      };
      
      console.log('Buscando leads com os headers:', headers);
      
      // Adicionar headers necessários
      const response = await fetch('/api/crm/leads', {
        headers: headers
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar leads');
      }
      
      const data = await response.json();
      setLeads(data);
      setDataLoaded(true);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os leads.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Efeito para buscar leads apenas na inicialização
  useEffect(() => {
    // Buscar leads apenas uma vez na montagem inicial
    if (!dataLoaded) {
      fetchLeads();
    }
    // Não configurar intervalo de polling para evitar muitas conexões
  }, [dataLoaded]);

  // Abrir diálogo de confirmação de deleção
  const handleOpenDeleteDialog = (lead: Lead) => {
    setLeadToDelete(lead);
    setConfirmDelete(true);
  };

  // Deletar lead
  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    
    setIsDeleting(leadToDelete.id);
    console.log(`Iniciando exclusão do lead: ${leadToDelete.id}`);
    
    try {
      // Usar os headers padrão da aplicação
      const headers = {
        'x-workspace-id': 'ws_default', // Este valor deve vir da configuração ou contexto da aplicação
        'Content-Type': 'application/json'
      };
      
      console.log(`Enviando requisição DELETE para: /api/crm/leads/${leadToDelete.id}`);
      console.log('Headers:', headers);
      
      const response = await fetch(`/api/crm/leads/${leadToDelete.id}`, {
        method: 'DELETE',
        headers: headers
      });
      
      // Registrar o status da resposta para diagnóstico
      console.log(`Resposta da exclusão - Status: ${response.status}`);
      const responseData = await response.json().catch(() => ({}));
      console.log('Resposta da exclusão - Dados:', responseData);
      
      if (!response.ok) {
        throw new Error(`Erro ao excluir lead: ${response.status} - ${responseData.error || 'Erro desconhecido'}`);
      }
      
      // Atualizar o estado local em vez de fazer nova requisição
      setLeads(currentLeads => currentLeads.filter(lead => lead.id !== leadToDelete.id));
      
      toast({
        title: "Lead excluído",
        description: "O lead foi excluído com sucesso",
      });
    } catch (error) {
      console.error('Erro detalhado ao excluir lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o lead",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
      setConfirmDelete(false);
      setLeadToDelete(null);
    }
  };

  // Função para deletar múltiplos leads
  const handleDeleteSelectedLeads = async () => {
    setIsDeletingMultiple(true);
    console.log(`Iniciando exclusão em lote de ${selectedLeads.length} leads`);
    
    try {
      // Usar os headers padrão da aplicação
      const headers = {
        'x-workspace-id': 'ws_default', // Este valor deve vir da configuração ou contexto da aplicação
        'Content-Type': 'application/json'
      };
      
      // Deletar cada lead selecionado
      const results = await Promise.all(
        selectedLeads.map(async (leadId) => {
          console.log(`Enviando requisição DELETE para: /api/crm/leads/${leadId}`);
          
          const response = await fetch(`/api/crm/leads/${leadId}`, {
            method: 'DELETE',
            headers: headers
          });
          
          console.log(`Resposta para lead ${leadId} - Status: ${response.status}`);
          
          if (!response.ok) {
            const responseData = await response.json().catch(() => ({}));
            console.error(`Erro ao excluir lead ${leadId}:`, responseData);
            return { id: leadId, success: false, error: responseData.error };
          }
          
          return { id: leadId, success: true };
        })
      );
      
      // Identificar quais leads foram excluídos com sucesso
      const successfulDeletes = results.filter(result => result.success).map(result => result.id);
      const failedDeletes = results.filter(result => !result.success);
      
      // Atualizar o estado local em vez de fazer nova requisição
      setLeads(currentLeads => currentLeads.filter(lead => !successfulDeletes.includes(lead.id)));
      setSelectedLeads([]);
      
      // Mostrar mensagem de sucesso apropriada
      if (failedDeletes.length === 0) {
        toast({
          title: "Leads excluídos",
          description: `${successfulDeletes.length} leads foram excluídos com sucesso`,
        });
      } else {
        toast({
          title: "Exclusão parcial",
          description: `${successfulDeletes.length} leads excluídos. ${failedDeletes.length} falhas.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao excluir leads em lote:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir alguns leads",
        variant: "destructive",
      });
    } finally {
      setIsDeletingMultiple(false);
      setConfirmDelete(false);
    }
  };

  // Função para selecionar/deselecionar todos os leads
  const toggleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(lead => lead.id));
    }
  };

  // Função para alternar a seleção de um lead
  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  // Função para atualizar manualmente
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLeads();
    setIsRefreshing(false);
  };

  // Adicione uma função para abrir o diálogo de edição
  const handleEditLead = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    setShowEditDialog(true);
  };

  // Função para lidar com a criação ou atualização de leads, atualizando o estado local
  const handleLeadCreated = (newLead?: Lead) => {
    // Se temos o lead completo, adicioná-lo diretamente ao estado
    if (newLead) {
      setLeads(prevLeads => [newLead, ...prevLeads]);
    } else {
      // Caso contrário, buscar todos os leads novamente
      fetchLeads();
    }
  };

  const handleLeadUpdated = (updatedLead?: Lead) => {
    // Se temos o lead atualizado, atualizar no estado
    if (updatedLead) {
      setLeads(prevLeads => 
        prevLeads.map(lead => lead.id === updatedLead.id ? updatedLead : lead)
      );
    } else {
      // Caso contrário, buscar todos os leads novamente
      fetchLeads();
    }
  };

  // Filtrar leads com base no termo de busca
  const filteredLeads = leads.filter(lead => {
    const searchTermLower = searchTerm.toLowerCase();
    const nameMatch = lead.name?.toLowerCase().includes(searchTermLower) || false;
    const phoneMatch = lead.phone.includes(searchTerm);
    const labelMatch = lead.labels.some(label => 
      label.name.toLowerCase().includes(searchTermLower)
    );
    
    return nameMatch || phoneMatch || labelMatch;
  });

  return (
    <div className="h-full">
      <div className="max-w-[1800px] mx-auto px-8">
        {/* Cabeçalho com título e botões principais */}
        <div className="flex items-center justify-between py-6">
          <h1 className="text-2xl font-bold text-white">Contatos</h1>
          <div className="flex gap-2">
            <TooltipProvider>
              {selectedLeads.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-red-800 text-red-500 hover:bg-red-950 hover:text-red-400"
                      onClick={() => setConfirmDelete(true)}
                      disabled={isDeletingMultiple}
                    >
                      {isDeletingMultiple ? (
                        <Spinner className="h-4 w-4 mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Deletar Selecionados ({selectedLeads.length})
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Excluir contatos selecionados</p>
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-700 bg-gray-800/40 text-gray-300 hover:bg-gray-700 hover:text-white mr-2"
                    onClick={() => setIsTutorialOpen(true)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ver tutorial</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-gray-700 hover:bg-gray-800 hover:text-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Contatos
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Importar lista de contatos</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-500"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Contato
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Adicionar novo contato</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Barra de ferramentas */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-700 hover:bg-gray-800 hover:text-white h-7 w-7"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filtrar contatos</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="relative w-64">
              <Search className="absolute left-3 top-1.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar contatos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-[#1A1D24] border-gray-700 h-7 min-h-0"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-700 hover:bg-gray-800 hover:text-white h-7 w-7"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Atualizar lista</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-700 hover:bg-gray-800 hover:text-white h-7 w-7"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Exportar contatos</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Spinner className="h-8 w-8" />
            <span className="ml-3 text-gray-400">Carregando contatos...</span>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="rounded-lg border border-gray-800 p-6">
            <h3 className="text-white font-medium">Sem contatos</h3>
            <p className="text-gray-400">Nenhum contato foi encontrado.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-800 overflow-hidden">
            {/* Cabeçalho da tabela */}
            <div className="grid grid-cols-[40px_80px_120px_1fr_1fr_1fr_100px] gap-4 p-4 bg-gray-900 text-sm font-medium text-gray-400">
              <div>
                <Checkbox
                  checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                  onCheckedChange={toggleSelectAll}
                  className="border-gray-600"
                />
              </div>
              <div>Avatar</div>
              <div>ID do Lead</div>
              <div>Nome</div>
              <div>Whatsapp ID</div>
              <div>Etiquetas</div>
              <div className="text-right">Ações</div>
            </div>

            {/* Linhas de dados */}
            <div className="divide-y divide-gray-800">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="grid grid-cols-[40px_80px_120px_1fr_1fr_1fr_100px] gap-4 p-4 items-center hover:bg-gray-900/50">
                  <div>
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => toggleLeadSelection(lead.id)}
                      className="border-gray-600"
                    />
                  </div>
                  <div>
                    {lead.photo ? (
                      <img 
                        src={lead.photo}
                        alt={lead.name || 'Lead'} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircle className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <div className="text-gray-300 text-sm font-mono">
                    {lead.id.slice(0, 8)}
                  </div>
                  <div className="text-white">
                    {lead.name || 'Sem nome'}
                  </div>
                  <div className="text-gray-300 font-mono">
                    {formatPhone(lead.phone)}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {lead.labels && lead.labels.length > 0 ? (
                      lead.labels.map(label => (
                        <Badge 
                          key={label.id}
                          className="px-2 py-0.5 text-xs whitespace-nowrap"
                          style={{ backgroundColor: label.color }}
                        >
                          {label.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500 text-xs">Sem etiquetas</span>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-blue-400"
                            onClick={() => handleEditLead(lead)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Editar contato</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-500"
                            onClick={() => handleOpenDeleteDialog(lead)}
                            disabled={!!isDeleting}
                          >
                            {isDeleting === lead.id ? (
                              <Spinner className="h-4 w-4" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Excluir contato</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diálogo de criação de lead */}
        <CreateLeadDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onLeadCreated={handleLeadCreated}
        />

        {/* Diálogo de edição de lead */}
        <EditLeadDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onLeadUpdated={handleLeadUpdated}
          leadId={selectedLeadId}
        />

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent className="bg-[#1A1D24] text-white border-gray-800">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                {selectedLeads.length > 0 ? (
                  <>
                    Tem certeza que deseja excluir {selectedLeads.length} contatos selecionados?
                    <br />
                    Esta ação não pode ser desfeita.
                  </>
                ) : (
                  <>
                    Tem certeza que deseja excluir este contato?
                    <br />
                    Esta ação não pode ser desfeita.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent text-white border-gray-600 hover:bg-gray-800 hover:text-white">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={selectedLeads.length > 0 ? handleDeleteSelectedLeads : handleDeleteLead}
                className="bg-red-600 text-white hover:bg-red-500"
                disabled={!!isDeleting || isDeletingMultiple}
              >
                {(!!isDeleting || isDeletingMultiple) ? <Spinner className="h-4 w-4 mr-2" /> : null}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Tutorial Modal */}
        <Tutorial 
          isOpen={isTutorialOpen} 
          onOpenChange={setIsTutorialOpen} 
        />
      </div>
    </div>
  );
} 