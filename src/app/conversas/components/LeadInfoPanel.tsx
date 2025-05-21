import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { 
  ChevronRight, 
  UserCircle, 
  Contact2, 
  ClipboardList, 
  StickyNote, 
  GitBranch, 
  RotateCw,
  Bookmark,
  CircleDollarSign,
  ChevronDown,
  Cpu
} from 'lucide-react';
import { formatPhone, formatDateTime } from '@/lib/utils/format';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useCallback } from 'react';
import { LeadTagsTab } from './LeadTagsTab';
import { LeadActivitiesTab } from './LeadActivitiesTab';

// Enum para os tipos de abas
enum TabType {
  NONE = 'none',
  INFO = 'info',
  FIELDS = 'fields',
  NOTES = 'notes',
  ACTIVITIES = 'activities',
  TAGS = 'tags',
  OPPORTUNITIES = 'opportunities'
}

interface Lead {
  id: string;
  name: string | null;
  phone: string;
  photo: string | null;
  createdAt: string;
  updatedAt: string;
  labels?: { id: string; name: string; color: string }[];
}

interface LeadInfoPanelProps {
  selectedConversationId: string | null;
  leadInfo: Lead | null;
  isLoadingLead: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onLeadUpdate?: () => void;
}

export function LeadInfoPanel({
  selectedConversationId,
  leadInfo,
  isLoadingLead,
  isExpanded,
  onToggleExpand,
  onLeadUpdate
}: LeadInfoPanelProps) {
  // Estado para controlar qual aba está ativa
  const [activeTab, setActiveTab] = useState<TabType>(TabType.INFO);

  // Função para alternar entre abas
  const toggleTab = useCallback((tab: TabType) => {
    setActiveTab(prevTab => prevTab === tab ? TabType.INFO : tab);
  }, []);

  return (
    <div
      className={`border-l border-gray-800 transition-all duration-300 flex flex-col ${
        isExpanded ? 'w-80' : 'w-14'
      }`}
    >
      <div className="h-[72px] border-b border-gray-800 flex items-center px-4 justify-between">
        {isExpanded ? (
          <>
            <span className="text-sm font-medium text-gray-400">Informações do Lead</span>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-8 w-8 text-gray-400 hover:text-[#ffffff]"
              onClick={onToggleExpand}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-8 w-8 mx-auto text-gray-400 hover:text-[#ffffff]"
            onClick={onToggleExpand}
          >
            <UserCircle className="h-5 w-5" />
          </Button>
        )}
      </div>
      {isExpanded && selectedConversationId && (
        <>
          <div className="h-[36px] border-b border-gray-800 flex items-center px-4 gap-2">
            <div className="flex-1 flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className={`h-7 w-7 ${activeTab === TabType.INFO ? 'text-white bg-blue-600 hover:bg-blue-700' : 'text-gray-400 hover:text-[#ffffff]'}`}
                      onClick={() => toggleTab(TabType.INFO)}
                    >
                      <Contact2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-gray-900 text-white border-gray-800">
                    <p>Informações do contato</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className={`h-7 w-7 ${activeTab === TabType.FIELDS ? 'text-white bg-blue-600 hover:bg-blue-700' : 'text-gray-400 hover:text-[#ffffff]'}`}
                      onClick={() => toggleTab(TabType.FIELDS)}
                    >
                      <Cpu className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-gray-900 text-white border-gray-800">
                    <p>Campos do Contato</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className={`h-7 w-7 ${activeTab === TabType.NOTES ? 'text-white bg-blue-600 hover:bg-blue-700' : 'text-gray-400 hover:text-[#ffffff]'}`}
                      onClick={() => toggleTab(TabType.NOTES)}
                    >
                      <StickyNote className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-gray-900 text-white border-gray-800">
                    <p>Anotações</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className={`h-7 w-7 ${activeTab === TabType.ACTIVITIES ? 'text-white bg-blue-600 hover:bg-blue-700' : 'text-gray-400 hover:text-[#ffffff]'}`}
                      onClick={() => toggleTab(TabType.ACTIVITIES)}
                    >
                      <GitBranch className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-gray-900 text-white border-gray-800">
                    <p>Atividades</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className={`h-7 w-7 ${activeTab === TabType.TAGS ? 'text-white bg-blue-600 hover:bg-blue-700' : 'text-gray-400 hover:text-[#ffffff]'}`}
                      onClick={() => toggleTab(TabType.TAGS)}
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-gray-900 text-white border-gray-800">
                    <p>Etiquetas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className={`h-7 w-7 ${activeTab === TabType.OPPORTUNITIES ? 'text-white bg-blue-600 hover:bg-blue-700' : 'text-gray-400 hover:text-[#ffffff]'}`}
                      onClick={() => toggleTab(TabType.OPPORTUNITIES)}
                    >
                      <CircleDollarSign className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-gray-900 text-white border-gray-800">
                    <p>Oportunidades Geradas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-[#ffffff]"
                    onClick={onLeadUpdate}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-gray-900 text-white border-gray-800">
                  <p>Atualizar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="p-4 space-y-6 flex-1 overflow-y-auto">
            {isLoadingLead ? (
              <div className="flex justify-center items-center h-32">
                <Spinner className="h-6 w-6" />
              </div>
            ) : leadInfo ? (
              <>
                {/* Cabeçalho do Lead - sempre visível */}
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-800">
                  {leadInfo.photo ? (
                    <div className="h-12 w-12 relative">
                      <img 
                        src={leadInfo.photo}
                        alt={leadInfo.name || 'Lead'}
                        className="h-12 w-12 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-avatar.png';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-lg">
                      {leadInfo.name ? leadInfo.name.charAt(0).toUpperCase() : '#'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-white">
                      {leadInfo.name || 'Sem nome'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {formatPhone(leadInfo.phone)}
                    </p>
                  </div>
                </div>

                {/* Conteúdo dinâmico com base na aba selecionada */}
                {activeTab === TabType.INFO && (
                  <div className="space-y-4">
                    {/* Conteúdo da aba de informações do contato */}
                    <p className="text-sm text-gray-400">Informações básicas do contato</p>
                  </div>
                )}

                {activeTab === TabType.TAGS && leadInfo && (
                  <LeadTagsTab 
                    key={`tags-${leadInfo.id}`}
                    leadId={leadInfo.id} 
                    onUpdate={() => {
                      console.log('LeadInfoPanel: Chamando onLeadUpdate da aba de etiquetas');
                      if (onLeadUpdate) onLeadUpdate();
                    }}
                  />
                )}

                {/* Outras abas serão implementadas conforme necessário */}
                {activeTab === TabType.FIELDS && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400">Campos do contato (em desenvolvimento)</p>
                  </div>
                )}

                {activeTab === TabType.NOTES && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400">Anotações (em desenvolvimento)</p>
                  </div>
                )}

                {activeTab === TabType.ACTIVITIES && (
                  <div className="space-y-4">
                    {leadInfo && <LeadActivitiesTab leadId={leadInfo.id} />}
                  </div>
                )}

                {activeTab === TabType.OPPORTUNITIES && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400">Oportunidades (em desenvolvimento)</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-400">
                Informações do lead não disponíveis
              </div>
            )}
          </div>
          
          {/* Informações de Data */}
          <div className="px-4 py-2 border-t border-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center">
                <span>Criado em: {leadInfo ? formatDateTime(leadInfo.createdAt) : '-'}</span>
                <div className="mx-2 h-3 w-px bg-gray-800"></div>
                <span>Atualizado em: {leadInfo ? formatDateTime(leadInfo.updatedAt) : '-'}</span>
              </div>
            </div>
          </div>
          
          {/* Divisor e Seção de Automação */}
          <div className="border-t border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 flex items-center gap-1">
                Pausar Agente
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help text-xs bg-gray-800 rounded-full h-4 w-4 inline-flex items-center justify-center">?</div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-gray-900 text-white border-gray-800">
                      <p>Pausar agente temporariamente</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 border-gray-800 bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white">
                    + 30 minutos
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-gray-800">
                  <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                    + 5 minutos
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                    + 10 minutos
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                    + 15 minutos
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                    + 1 hora
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                    + 2 horas
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                    + 3 horas
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                    + 4 horas
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                    + 5 horas
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                    + 12 horas
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                    + 24 horas
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                    + 7 dias
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                    + 30 dias
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                    + 100 dias
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-400 hover:text-white focus:text-white focus:bg-gray-800">
                    + 1 ano
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-2">
              <Button variant="ghost" className="w-full justify-center text-white bg-blue-600 hover:bg-blue-700">
                Automaticamente
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 