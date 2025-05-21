'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { countries } from '@/lib/data/countries';
import { FlagIcon } from '@/components/FlagIcon';

interface CountrySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function CountrySelect({ 
  value, 
  onValueChange, 
  className,
  disabled = false 
}: CountrySelectProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm)
  );

  // Trata o valor recebido para compatibilidade com o formato id:dialCode
  const handleValueChange = (newValue: string) => {
    // Extrair apenas o código de discagem se for no formato id:dialCode
    const dialCode = newValue.includes(':') ? newValue.split(':')[1] : newValue;
    onValueChange(dialCode);
  };

  // Valor composto para uso interno do componente
  const internalValue = countries.find(c => c.dialCode === value)
    ? `${countries.find(c => c.dialCode === value)?.id}:${value}`
    : value;

  return (
    <Select
      value={internalValue}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={`bg-gray-900/50 border-gray-700 text-white ${className || ''}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-gray-900 border-gray-700 max-h-80">
        <div className="flex items-center px-3 py-2 border-b border-gray-700">
          <label htmlFor="country-search" className="sr-only">Buscar país</label>
          <Search className="h-4 w-4 text-gray-400 mr-2" />
          <Input
            id="country-search"
            placeholder="Buscar país..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 bg-transparent text-white focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            aria-label="Buscar país por nome ou código de discagem"
          />
        </div>
        <ScrollArea className="h-[200px]">
          {filteredCountries.map((country) => (
            <SelectItem
              key={country.id}
              value={`${country.id}:${country.dialCode}`}
              className="text-white hover:bg-gray-800 focus:bg-gray-800"
            >
              <div className="flex items-center gap-2">
                <FlagIcon countryCode={country.code} />
                <span>{country.name}</span>
                <span className="text-gray-400 ml-auto">
                  {country.dialCode}
                </span>
              </div>
            </SelectItem>
          ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
} 