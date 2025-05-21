import { useState, useEffect } from 'react';

interface Lead {
  id: string;
  name: string | null;
  phone: string;
  photo: string | null;
  createdAt: string;
  updatedAt: string;
  labels?: { id: string; name: string; color: string }[];
}

export function useLead(leadId: string | null) {
  const [leadInfo, setLeadInfo] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Buscar informações do lead
  const fetchLeadInfo = async (id: string) => {
    if (!id) return;
    setIsLoading(true);
    
    console.log('useLead: Buscando informações do lead:', id);
    
    try {
      const response = await fetch(`/api/crm/leads/${id}`);
      if (!response.ok) throw new Error('Erro ao buscar informações do lead');
      const data = await response.json();
      console.log('useLead: Dados do lead carregados:', data);
      setLeadInfo(data);
    } catch (error) {
      console.error('useLead: Erro ao buscar informações do lead:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Usando useEffect para controlar quando buscar o lead
  useEffect(() => {
    console.log('useLead: useEffect disparado, leadId:', leadId);
    if (leadId) {
      fetchLeadInfo(leadId);
    } else {
      // Limpar o lead quando não houver leadId
      setLeadInfo(null);
    }
  }, [leadId]); // Depende apenas do leadId

  return {
    leadInfo,
    isLoading,
    isExpanded,
    setIsExpanded,
    refreshLeadInfo: () => {
      console.log('useLead: refreshLeadInfo chamado, leadId:', leadId);
      if (leadId) fetchLeadInfo(leadId);
    }
  };
} 