'use client';

import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, CheckCircle, AlertCircle, Clock, Calendar, Tag, ArrowRight, Share2, UserPlus, Mail, Phone } from 'lucide-react';

interface Activity {
  id: string;
  type: 'message_sent' | 'message_received' | 'conversation_started' | 'tag_added' | 'tag_removed' | 'status_changed' | 'agent_assigned' | 'email_sent' | 'phone_call';
  description: string;
  createdAt: string;
  metadata?: {
    tagName?: string;
    tagColor?: string;
    status?: string;
    agentName?: string;
  };
}

interface LeadActivitiesTabProps {
  leadId: string;
}

export function LeadActivitiesTab({ leadId }: LeadActivitiesTabProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função para carregar as atividades do lead
  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        // Simular uma chamada de API para obter atividades
        // Em produção, isso seria substituído por uma chamada real à API
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Dados simulados de atividades para demonstração
        const mockActivities: Activity[] = [
          {
            id: '1',
            type: 'conversation_started',
            description: 'Conversa iniciada',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Ontem
          },
          {
            id: '2',
            type: 'message_sent',
            description: 'Mensagem automática enviada',
            createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '3',
            type: 'message_received',
            description: 'Cliente respondeu',
            createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '4',
            type: 'tag_added',
            description: 'Etiqueta adicionada',
            createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
            metadata: {
              tagName: 'Interessado',
              tagColor: '#4CAF50',
            },
          },
          {
            id: '5',
            type: 'agent_assigned',
            description: 'Atendente atribuído',
            createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            metadata: {
              agentName: 'Fernanda Silva',
            },
          },
          {
            id: '6',
            type: 'status_changed',
            description: 'Status alterado',
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            metadata: {
              status: 'Em atendimento',
            },
          },
          {
            id: '7',
            type: 'message_sent',
            description: 'Atendente enviou mensagem',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '8',
            type: 'message_received',
            description: 'Cliente respondeu',
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          },
        ];
        
        setActivities(mockActivities);
      } catch (error) {
        console.error('Erro ao carregar atividades:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActivities();
  }, [leadId]);

  // Formatar a data para um formato legível
  const formatActivityDate = (dateString: string) => {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return `Hoje, ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Ontem, ${format(date, 'HH:mm')}`;
    } else {
      return format(date, "dd 'de' MMMM, HH:mm", { locale: ptBR });
    }
  };

  // Obter o ícone apropriado para cada tipo de atividade
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'message_sent':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'message_received':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'conversation_started':
        return <Share2 className="h-4 w-4 text-purple-500" />;
      case 'tag_added':
      case 'tag_removed':
        return <Tag className="h-4 w-4 text-orange-500" />;
      case 'status_changed':
        return <ArrowRight className="h-4 w-4 text-amber-500" />;
      case 'agent_assigned':
        return <UserPlus className="h-4 w-4 text-indigo-500" />;
      case 'email_sent':
        return <Mail className="h-4 w-4 text-cyan-500" />;
      case 'phone_call':
        return <Phone className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Agrupar atividades por data
  const groupActivitiesByDate = () => {
    const grouped: { [key: string]: Activity[] } = {};
    
    activities.forEach(activity => {
      const date = parseISO(activity.createdAt);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(activity);
    });
    
    return grouped;
  };

  // Formatação do título do grupo
  const formatGroupTitle = (dateKey: string) => {
    const date = parseISO(dateKey);
    
    if (isToday(date)) {
      return 'Hoje';
    } else if (isYesterday(date)) {
      return 'Ontem';
    } else {
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center p-6 text-gray-400">
        Nenhuma atividade registrada para este contato.
      </div>
    );
  }

  const groupedActivities = groupActivitiesByDate();
  const dateKeys = Object.keys(groupedActivities).sort((a, b) => {
    // Ordenar por data decrescente (mais recente primeiro)
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <div className="space-y-4">
      {dateKeys.map(dateKey => (
        <div key={dateKey} className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            {formatGroupTitle(dateKey)}
          </h3>
          
          <div className="space-y-3">
            {groupedActivities[dateKey].map(activity => (
              <div 
                key={activity.id} 
                className="flex items-start gap-3 pb-3 border-b border-gray-800 last:border-0"
              >
                <div className="mt-1">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-white">{activity.description}</span>
                    <span className="text-xs text-gray-500">{format(parseISO(activity.createdAt), 'HH:mm')}</span>
                  </div>
                  
                  {activity.metadata?.tagName && (
                    <div className="mt-1 flex items-center">
                      <div 
                        className="h-2 w-2 rounded-full mr-1" 
                        style={{ backgroundColor: activity.metadata.tagColor }}
                      ></div>
                      <span className="text-xs text-gray-400">{activity.metadata.tagName}</span>
                    </div>
                  )}
                  
                  {activity.metadata?.status && (
                    <div className="mt-1">
                      <span className="text-xs text-gray-400">
                        <span className="text-gray-500">Status:</span> {activity.metadata.status}
                      </span>
                    </div>
                  )}
                  
                  {activity.metadata?.agentName && (
                    <div className="mt-1">
                      <span className="text-xs text-gray-400">
                        <span className="text-gray-500">Atendente:</span> {activity.metadata.agentName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 