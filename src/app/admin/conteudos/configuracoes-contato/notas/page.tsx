'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, RefreshCw, Search, Pencil, Trash2, Calendar, Filter, StickyNote, Clock } from 'lucide-react';

// Interface para notas de atendimento
interface Note {
  id: string;
  content: string;
  contactName: string;
  contactId: string;
  authorName: string;
  authorId: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function NotasPage() {
  // Estados para gerenciar as notas
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      content: 'Cliente interessado em expandir plano para mais usuários. Solicitou orçamento para 10 usuários adicionais.',
      contactName: 'João Silva',
      contactId: 'c1',
      authorName: 'Maria Oliveira',
      authorId: 'u1',
      category: 'comercial',
      createdAt: new Date('2023-11-10T14:30:00'),
      updatedAt: new Date('2023-11-10T14:30:00'),
    },
    {
      id: '2',
      content: 'Reclamação sobre lentidão no sistema durante o horário de pico (14h-16h). Encaminhado para equipe de suporte técnico.',
      contactName: 'Ana Ferreira',
      contactId: 'c2',
      authorName: 'Maria Oliveira',
      authorId: 'u1',
      category: 'suporte',
      createdAt: new Date('2023-11-08T10:15:00'),
      updatedAt: new Date('2023-11-08T11:20:00'),
    },
    {
      id: '3',
      content: 'Solicitou demonstração da nova funcionalidade de relatórios. Agendado para próxima semana.',
      contactName: 'Carlos Mendes',
      contactId: 'c3',
      authorName: 'Paulo Santos',
      authorId: 'u2',
      category: 'comercial',
      createdAt: new Date('2023-11-05T09:45:00'),
      updatedAt: new Date('2023-11-05T09:45:00'),
    },
  ]);

  // Estados para controle da interface
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [noteDialog, setNoteDialog] = useState<boolean>(false);
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Estados para o formulário de notas
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [newNoteContact, setNewNoteContact] = useState<string>('');
  const [newNoteCategory, setNewNoteCategory] = useState<string>('geral');

  // Categorias para notas
  const categories = [
    { id: 'geral', name: 'Geral' },
    { id: 'comercial', name: 'Comercial' },
    { id: 'suporte', name: 'Suporte' },
    { id: 'financeiro', name: 'Financeiro' },
    { id: 'outro', name: 'Outro' },
  ];

  // Simulação de atualização
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Filtragem das notas com base no termo de busca e categoria
  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.authorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || !filterCategory ? true : note.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Ordenar notas por data (mais recentes primeiro)
  const sortedNotes = [...filteredNotes].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  // Abrir diálogo para adicionar nova nota
  const handleAddNote = () => {
    setSelectedNote(null);
    setNewNoteContent('');
    setNewNoteContact('');
    setNewNoteCategory('geral');
    setIsEditing(false);
    setNoteDialog(true);
  };

  // Abrir diálogo para editar nota existente
  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setNewNoteContent(note.content);
    setNewNoteContact(note.contactName);
    setNewNoteCategory(note.category);
    setIsEditing(true);
    setNoteDialog(true);
  };

  // Abrir diálogo para confirmar exclusão
  const handleDeleteClick = (note: Note) => {
    setSelectedNote(note);
    setDeleteDialog(true);
  };

  // Salvar nova nota ou atualizar existente
  const handleSaveNote = () => {
    if (!newNoteContent.trim()) return;

    if (isEditing && selectedNote) {
      // Atualizar nota existente
      const updatedNotes = notes.map(note => 
        note.id === selectedNote.id 
          ? { 
              ...note, 
              content: newNoteContent,
              contactName: newNoteContact || note.contactName,
              category: newNoteCategory,
              updatedAt: new Date()
            } 
          : note
      );
      setNotes(updatedNotes);
    } else {
      // Criar nova nota
      const newNote: Note = {
        id: Date.now().toString(),
        content: newNoteContent,
        contactName: newNoteContact || 'Sem contato',
        contactId: 'new',
        authorName: 'Usuário Atual',
        authorId: 'current',
        category: newNoteCategory,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setNotes([newNote, ...notes]);
    }

    setNoteDialog(false);
  };

  // Excluir nota
  const handleDeleteNote = () => {
    if (!selectedNote) return;
    
    const updatedNotes = notes.filter(note => note.id !== selectedNote.id);
    setNotes(updatedNotes);
    setDeleteDialog(false);
  };

  // Formatador de data
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Notas de Atendimento</h1>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Atualizar"
            className="bg-[#1A1D24] border-gray-800 text-gray-400 hover:text-white hover:bg-[#2A2D34]"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          
          <Button 
            onClick={handleAddNote}
            className="bg-blue-600 text-white hover:bg-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Nota
          </Button>
        </div>
      </div>
      
      {/* Filtros e Busca */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Buscar notas por conteúdo, contato ou autor..."
            className="pl-10 bg-[#1A1D24] border-gray-800 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="bg-[#1A1D24] border-gray-800 text-white">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <SelectValue placeholder="Filtrar por categoria" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1A1D24] border-gray-800 text-white">
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Lista de Notas */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sortedNotes.length === 0 ? (
        <div className="bg-[#1A1D24] border border-gray-800 rounded-lg p-8 text-center">
          <StickyNote className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium text-white mb-2">Nenhuma nota encontrada</h3>
          <p className="text-gray-400 mb-4">
            Você ainda não possui notas de atendimento registradas. Adicione sua primeira nota utilizando o botão acima.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedNotes.map((note) => (
            <Card key={note.id} className="bg-[#1A1D24] border-gray-800 text-white">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="text-base">{note.contactName}</CardTitle>
                    <CardDescription className="text-gray-400 text-xs flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(note.createdAt)}
                      {note.updatedAt.getTime() !== note.createdAt.getTime() && (
                        <span className="italic ml-1">(editado)</span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditNote(note)}
                      title="Editar"
                      className="h-8 w-8 hover:bg-[#2A2D34]"
                    >
                      <Pencil className="h-4 w-4 text-gray-400 hover:text-white" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteClick(note)}
                      title="Excluir"
                      className="h-8 w-8 hover:bg-red-950/50"
                    >
                      <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-400" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2 pt-0">
                <p className="text-gray-300 whitespace-pre-line">{note.content}</p>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between items-center text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="mr-1">Por:</span>
                  <span className="text-gray-400">{note.authorName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`px-2 py-1 rounded text-xs ${
                    note.category === 'comercial' 
                      ? 'bg-blue-900/30 text-blue-400' 
                      : note.category === 'suporte' 
                      ? 'bg-green-900/30 text-green-400'
                      : note.category === 'financeiro'
                      ? 'bg-purple-900/30 text-purple-400'
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    {categories.find(c => c.id === note.category)?.name || 'Geral'}
                  </span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Diálogo para adicionar/editar nota */}
      <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
        <DialogContent className="bg-[#1A1D24] border-gray-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Nota' : 'Nova Nota de Atendimento'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {isEditing 
                ? 'Edite os detalhes da nota de atendimento abaixo.' 
                : 'Preencha os detalhes da nova nota de atendimento abaixo.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-contact">Contato</Label>
              <Input
                id="note-contact"
                value={newNoteContact}
                onChange={(e) => setNewNoteContact(e.target.value)}
                className="bg-[#0F1115] border-gray-800 text-white"
                placeholder="Nome do contato (opcional)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="note-category">Categoria</Label>
              <Select value={newNoteCategory} onValueChange={setNewNoteCategory}>
                <SelectTrigger id="note-category" className="bg-[#0F1115] border-gray-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1D24] border-gray-800 text-white">
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="note-content">Conteúdo da Nota</Label>
              <Textarea
                id="note-content"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="min-h-[120px] bg-[#0F1115] border-gray-800 text-white"
                placeholder="Descreva a nota de atendimento..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setNoteDialog(false)}
              className="bg-transparent hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveNote}
              className="bg-blue-600 text-white hover:bg-blue-500"
              disabled={!newNoteContent.trim()}
            >
              {isEditing ? 'Salvar Alterações' : 'Adicionar Nota'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-[#1A1D24] text-white border-gray-800">
          <DialogHeader>
            <DialogTitle>Excluir Nota</DialogTitle>
            <DialogDescription className="text-gray-400">
              Esta ação não pode ser desfeita. A nota será permanentemente excluída.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="mb-4 text-gray-300">
              Você está prestes a excluir uma nota de atendimento. Tem certeza que deseja continuar?
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteNote}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 