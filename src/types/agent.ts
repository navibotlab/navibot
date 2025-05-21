export interface Condition {
  id: string;
  type: 'keyword' | 'intent' | 'entity' | 'custom';
  value: string;
  action: 'next_stage' | 'collect_info' | 'redirect' | 'custom_response';
  targetStageId?: string;
  response?: string;
}

export interface Stage {
  id: string;
  name: string;
  description: string;
  prompt: string;
  conditions: Condition[];
}

export interface Agent {
  id: string;
  name: string;
  internalName: string;
  imageUrl: string;
  initialMessage: string;
  voiceTone: string;
  model: string;
  language: string;
  timezone: string;
  instructions: string;
  temperature: number;
  frequencyPenalty: number;
  presencePenalty: number;
  topP: number;
  maxMessages: number;
  maxTokens: number;
  responseFormat: string;
  companyName: string;
  companySector: string;
  companyWebsite: string;
  companyDescription: string;
  personalityObjective: string;
  agentSkills: string;
  agentFunction: string;
  productInfo: string;
  restrictions: string;
  assistantId: string;
  vectorStoreId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentFormData extends Agent {
  // Campos adicionais específicos do formulário, se necessário
}

export interface UpdateAgentFormProps {
  onSubmit: (data: Agent, activeTab: string, onSuccess?: (data?: any) => void) => Promise<void>;
  onCancel: () => void;
  editingAgent: Agent | null;
} 