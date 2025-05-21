'use client';

import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

// Interface para etiquetas
export interface Label {
  id: string;
  name: string;
  color: string;
  usageCount: number; // Contador de uso
  createdAt: string;
}

interface LabelsListProps {
  labels: Label[];
  onEdit: (label: Label) => void;
  onDelete: (id: string) => void;
}

export function LabelsList({ labels, onEdit, onDelete }: LabelsListProps) {
  return (
    <div className="rounded-lg border border-gray-800 overflow-hidden">
      <Table>
        <TableHeader className="bg-[#1A1D24]">
          <TableRow className="hover:bg-[#1A1D24]/90 border-gray-800">
            <TableHead className="text-gray-400 w-[120px]">ID</TableHead>
            <TableHead className="text-gray-400 w-[60px]">Cor</TableHead>
            <TableHead className="text-gray-400">Nome</TableHead>
            <TableHead className="text-gray-400 w-[100px] text-center">Uso</TableHead>
            <TableHead className="text-gray-400 w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {labels.length === 0 ? (
            <TableRow className="hover:bg-[#1A1D24]/80 border-gray-800">
              <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                Nenhuma etiqueta encontrada
              </TableCell>
            </TableRow>
          ) : (
            labels.map((label) => (
              <TableRow key={label.id} className="hover:bg-[#1A1D24]/80 border-gray-800">
                <TableCell className="text-white font-mono text-sm">
                  {label.id.substring(0, 8)}...
                </TableCell>
                <TableCell>
                  <div 
                    className="w-6 h-6 rounded-full" 
                    style={{ backgroundColor: label.color }}
                    title={`Cor: ${label.color}`}
                  />
                </TableCell>
                <TableCell className="text-white font-medium">
                  <div className="flex items-center">
                    <span 
                      className="w-2 h-2 rounded-full mr-2" 
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                  </div>
                </TableCell>
                <TableCell className="text-center text-gray-400">
                  {label.usageCount}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(label)}
                      className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(label.id)}
                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 