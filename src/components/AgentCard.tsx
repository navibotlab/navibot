'use client';

import { useState } from 'react';
import { Agent } from '@/types/agent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteAgentDialog } from '@/components/DeleteAgentDialog';
import { User, Check, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AgentCardProps {
  agent: Agent;
  onEdit: () => void;
  onDelete: () => void;
  isSelected: boolean;
  onSelect: (agentId: string, isSelected: boolean) => void;
}

export function AgentCard({ agent, onEdit, onDelete, isSelected, onSelect }: AgentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  const handleSelectChange = () => {
    onSelect(agent.id, !isSelected);
  };

  return (
    <>
      <Card className="bg-[#1A1D24] text-white border border-gray-800 relative group hover:border-gray-700 transition-colors">
        <div 
          className="absolute top-3 right-3 w-5 h-5 rounded border border-gray-600 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
          onClick={handleSelectChange}
          style={{ backgroundColor: isSelected ? '#3b82f6' : 'transparent' }}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-900/50 flex items-center justify-center border border-gray-800">
              {agent.imageUrl && !imageError ? (
                <img
                  src={agent.imageUrl.startsWith('/') ? agent.imageUrl : '/images/avatar/avatar.png'}
                  alt={agent.name || "Agente"}
                  className="w-full h-full object-cover"
                  onError={() => {
                    setImageError(true);
                  }}
                />
              ) : (
                <User className="w-8 h-8 text-gray-500" />
              )}
            </div>
            <CardTitle className="text-lg font-medium">
              {agent.name || "Agente sem nome"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1.5">
            <p className="text-sm text-gray-400 flex items-center justify-between">
              <span className="font-medium">ID do Agente:</span>
              <span className="font-mono">{agent.id.slice(0, 8)}</span>
            </p>
            <p className="text-sm text-gray-400 flex items-center justify-between">
              <span className="font-medium">Nome Interno:</span>
              <span>{agent.internalName}</span>
            </p>
            <p className="text-sm text-gray-400 flex items-center justify-between">
              <span className="font-medium">Modelo:</span>
              <span>{agent.model}</span>
            </p>
            <p className="text-sm text-gray-400 flex items-center justify-between">
              <span className="font-medium">Idioma:</span>
              <span>{agent.language === 'pt' ? 'Português' : agent.language === 'en' ? 'Inglês' : 'Espanhol'}</span>
            </p>
            <p className="text-sm text-gray-400 flex items-center justify-between">
              <span className="font-medium">Tom de voz:</span>
              <span>{agent.voiceTone}</span>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline"
                  className="bg-blue-600 hover:bg-blue-500 text-white border-0"
                  onClick={() => router.push(`/admin/chat/${agent.id}`)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Iniciar chat com o agente</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={onEdit}
                  className="border-gray-700 hover:bg-gray-800 group/edit"
                >
                  <Pencil className="w-4 h-4 text-gray-400 group-hover/edit:text-white transition-colors" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar agente</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                  className="border-red-800 text-red-500 hover:bg-red-950 hover:text-red-400 h-9 w-9"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Excluir agente</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>

      <DeleteAgentDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={onDelete}
        agentName={agent.name || agent.internalName || "Agente sem nome"}
        title="Excluir Agente"
        description="Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita."
      />
    </>
  );
} 