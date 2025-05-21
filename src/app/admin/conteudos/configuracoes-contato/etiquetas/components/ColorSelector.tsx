'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ColorSelectorProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

// Paleta de cores expandida com 7 cores adicionais
const colorOptions = [
  { hex: '#F44336', name: 'Vermelho' },
  { hex: '#E91E63', name: 'Rosa' },
  { hex: '#9C27B0', name: 'Roxo' },
  { hex: '#673AB7', name: 'Roxo Escuro' },
  { hex: '#3F51B5', name: 'Indigo' },
  { hex: '#2196F3', name: 'Azul' },
  { hex: '#03A9F4', name: 'Azul Claro' },
  { hex: '#00BCD4', name: 'Ciano' },
  { hex: '#009688', name: 'Verde-azulado' },
  { hex: '#4CAF50', name: 'Verde' },
  { hex: '#8BC34A', name: 'Verde Claro' },
  { hex: '#CDDC39', name: 'Lima' },
  { hex: '#FFEB3B', name: 'Amarelo' },
  { hex: '#FFC107', name: 'Âmbar' },
  { hex: '#FF9800', name: 'Laranja' },
  { hex: '#795548', name: 'Marrom' },
  { hex: '#9E9E9E', name: 'Cinza' },
  // Cores adicionais
  { hex: '#FF5722', name: 'Laranja Escuro' },
  { hex: '#607D8B', name: 'Azul Acinzentado' },
  { hex: '#FF4081', name: 'Rosa Forte' },
  { hex: '#7C4DFF', name: 'Roxo Profundo' },
  { hex: '#76FF03', name: 'Verde Neon' },
  { hex: '#FFD600', name: 'Amarelo Ouro' },
  { hex: '#64FFDA', name: 'Turquesa' },
];

export function ColorSelector({ selectedColor, onSelectColor }: ColorSelectorProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="grid grid-cols-8 gap-2">
        {colorOptions.map((color) => (
          <Tooltip key={color.hex}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onSelectColor(color.hex)}
                className={cn(
                  "w-8 h-8 rounded-full transition-transform duration-200 hover:scale-125 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white",
                  selectedColor === color.hex ? "ring-2 ring-white ring-offset-2 ring-offset-gray-800" : ""
                )}
                style={{ backgroundColor: color.hex }}
                aria-label={`Selecionar cor ${color.name}`}
              />
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className="bg-black text-white border-gray-800 px-3 py-1 text-xs"
              sideOffset={5}
            >
              {color.name}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
} 