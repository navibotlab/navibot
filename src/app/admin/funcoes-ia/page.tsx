'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { Loader2, Plus, RefreshCw, Search, Code } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FuncoesIAPage() {
  const [functions, setFunctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  // Função para carregar as funções de IA (por enquanto apenas simula o carregamento)
  const fetchFunctions = async () => {
    setRefreshing(true);
    
    try {
      // Simulando uma chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Por enquanto, vamos usar um array vazio
      setFunctions([]);
      
    } catch (error) {
      console.error('Erro ao carregar funções de IA:', error);
      toast.error('Erro ao carregar funções de IA');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFunctions();
  }, []);

  // Filtrar funções pelo termo de busca (quando tivermos funções)
  const filteredFunctions = functions.filter(func => 
    func.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Funções de IA</h1>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchFunctions}
            disabled={refreshing}
            title="Atualizar"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          
          <Button onClick={() => setOpenDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Função
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Buscar funções..."
            className="pl-10 bg-[#1A1D24] border-gray-800 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : functions.length === 0 ? (
        <div className="bg-[#1A1D24] border border-gray-800 rounded-lg p-8 text-center">
          <Code className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-medium text-white mb-2">Nenhuma função encontrada</h3>
          <p className="text-gray-400 mb-4">
            Você ainda não criou nenhuma função de IA. Clique no botão acima para adicionar sua primeira função.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {/* Aqui será exibida a lista de funções quando tivermos dados */}
        </div>
      )}
      
      {/* Diálogo para adicionar nova função (será implementado posteriormente) */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-[#1A1D24] text-white border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Função</DialogTitle>
            <DialogDescription className="text-gray-400">
              Crie uma nova função de IA para ser utilizada pelos seus assistentes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-center text-gray-400">
              Funcionalidade em desenvolvimento. Mais detalhes em breve.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setOpenDialog(false)}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 