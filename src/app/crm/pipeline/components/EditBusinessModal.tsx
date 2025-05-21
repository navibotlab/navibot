'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Lead {
  id: string | number;
  name?: string;
  title?: string;
  fullName?: string;
  tag?: string;
  value: string | number;
  email?: string;
  phone?: string;
  companyName?: string;
  stageId?: string | number;
  photo?: string;
  hasMessages?: boolean;
  hasActivity?: boolean;
  tagColor?: string;
  tags?: Array<{name: string, color: string}> | string[];
  contact?: string;
  createdAt?: string;
  progress?: number;
  originId?: string;
}

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadData: Partial<Lead>) => void;
  lead: Lead;
}

export function EditLeadModal({ isOpen, onClose, onSave, lead }: EditLeadModalProps) {
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '',
    title: '',
    tag: '',
    value: '',
    email: '',
    phone: '',
    companyName: '',
  });

  useEffect(() => {
    // Preencher o formulário com os dados do lead quando abrir o modal
    if (lead && isOpen) {
      console.log('Carregando dados do lead para edição:', lead);
      setFormData({
        id: lead.id,
        // Nome do negócio pode estar em title ou name
        name: lead.name || lead.title || '',
        title: lead.title || lead.name || '',
        tag: lead.tag || '',
        value: typeof lead.value === 'number' ? lead.value.toString() : lead.value || '',
        email: lead.email || '',
        // Contato pode estar em phone, contact ou email
        phone: lead.phone || '',
        contact: lead.contact || lead.email || '',
        companyName: lead.companyName || '',
        // Preservar outras propriedades importantes
        stageId: lead.stageId,
        originId: lead.originId,
        tags: lead.tags,
        // Se tiver dados de progresso, manter
        progress: lead.progress,
        createdAt: lead.createdAt
      });
    }
  }, [lead, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagChange = (value: string) => {
    setFormData(prev => ({ ...prev, tag: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Garantir que os campos obrigatórios estejam presentes
    const updatedData = {
      ...formData,
      // Garantir que title e name tenham o mesmo valor
      title: formData.name || formData.title,
      name: formData.name || formData.title,
      // Usar o contact como email se não tiver email definido
      email: formData.email || formData.contact,
      // Preservar os IDs originais
      id: lead.id,
      stageId: lead.stageId,
      originId: lead.originId
    };
    
    console.log('Enviando dados atualizados do lead:', updatedData);
    onSave(updatedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Negócio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Negócio</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="companyName">Empresa</Label>
              <Input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="value">Valor (R$)</Label>
              <Input
                id="value"
                name="value"
                type="text"
                value={formData.value}
                onChange={handleChange}
                placeholder="0,00"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="tag">Categoria</Label>
              <Select 
                value={formData.tag} 
                onValueChange={handleTagChange}
              >
                <SelectTrigger id="tag">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Novo">Novo</SelectItem>
                  <SelectItem value="Quente">Quente</SelectItem>
                  <SelectItem value="Frio">Frio</SelectItem>
                  <SelectItem value="Médio">Médio</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                  <SelectItem value="Prioritário">Prioritário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Alterações</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 