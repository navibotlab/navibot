'use client';

import React, { useState } from 'react';
import {
  X,
  Bookmark,
  Heart,
  Star,
  User,
  ShoppingCart,
  Clock,
  Settings,
  BarChart2,
  Camera,
  Music,
  Calendar,
  Globe,
  Monitor,
  Search,
  Tag,
  Mail,
  Smile,
  Briefcase,
  BarChart,
  Target,
  Link,
  Bell,
  Gift,
  Wifi,
  Code,
  Shield,
  Upload,
  Download,
  MessageSquare,
  MessageCircle,
  Home,
  Phone
} from 'lucide-react';

// Lista de cores disponíveis
const colorOptions = [
  'bg-[#161A2C]', // azul escuro
  'bg-[#9333EA]', // roxo
  'bg-[#A78BFA]', // roxo claro
  'bg-[#F472B6]', // rosa
  'bg-[#2563EB]', // azul
  'bg-[#60A5FA]', // azul claro
  'bg-[#10B981]', // verde
  'bg-[#34D399]', // verde claro
  'bg-[#92400E]', // marrom
  'bg-[#EF4444]', // vermelho
  'bg-[#FCA5A5]', // vermelho claro
  'bg-[#F97316]', // laranja
  'bg-[#FBBF24]', // amarelo
  'bg-[#EAB308]', // amarelo ouro
  'bg-[#A3E635]', // verde lima
  'bg-[#6B7280]', // cinza
  'bg-[#D1D5DB]', // cinza claro
  'bg-[#F3F4F6]', // cinza mais claro
  'bg-[#14B8A6]', // teal
  'bg-[#2DD4BF]', // teal claro
  'bg-[#BAE6FD]', // azul piscina
  'bg-[#E0F2FE]', // azul mais claro
  'bg-[#4F46E5]', // indigo
  'bg-[#3B82F6]', // blue-500
];

interface LucideIcon {
  id: string;
  icon: React.ReactNode;
}

// Lista de ícones da biblioteca Lucide
const lucideIcons: LucideIcon[] = [
  { id: 'bookmark', icon: <Bookmark size={20} /> },
  { id: 'heart', icon: <Heart size={20} /> },
  { id: 'star', icon: <Star size={20} /> },
  { id: 'user', icon: <User size={20} /> },
  { id: 'shopping-cart', icon: <ShoppingCart size={20} /> },
  { id: 'clock', icon: <Clock size={20} /> },
  { id: 'settings', icon: <Settings size={20} /> },
  { id: 'bar-chart-2', icon: <BarChart2 size={20} /> },
  { id: 'camera', icon: <Camera size={20} /> },
  { id: 'music', icon: <Music size={20} /> },
  { id: 'calendar', icon: <Calendar size={20} /> },
  { id: 'globe', icon: <Globe size={20} /> },
  { id: 'monitor', icon: <Monitor size={20} /> },
  { id: 'search', icon: <Search size={20} /> },
  { id: 'tag', icon: <Tag size={20} /> },
  { id: 'mail', icon: <Mail size={20} /> },
  { id: 'smile', icon: <Smile size={20} /> },
  { id: 'briefcase', icon: <Briefcase size={20} /> },
  { id: 'bar-chart', icon: <BarChart size={20} /> },
  { id: 'target', icon: <Target size={20} /> },
  { id: 'link', icon: <Link size={20} /> },
  { id: 'bell', icon: <Bell size={20} /> },
  { id: 'gift', icon: <Gift size={20} /> },
  { id: 'wifi', icon: <Wifi size={20} /> },
  { id: 'code', icon: <Code size={20} /> },
  { id: 'shield', icon: <Shield size={20} /> },
  { id: 'upload', icon: <Upload size={20} /> },
  { id: 'download', icon: <Download size={20} /> },
  { id: 'message-circle', icon: <MessageCircle size={20} /> },
  { id: 'message-square', icon: <MessageSquare size={20} /> },
  { id: 'home', icon: <Home size={20} /> },
  { id: 'phone', icon: <Phone size={20} /> },
];

interface AddOriginGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (group: { name: string; color: string; icon: string }) => void;
}

export function AddOriginGroupModal({ isOpen, onClose, onSave }: AddOriginGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    color: 'bg-[#9333EA]', // Roxo como cor padrão
    icon: 'user', // Ícone de usuário como padrão
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleColorSelect = (color: string) => {
    setFormData((prev) => ({ ...prev, color }));
  };

  const handleIconSelect = (iconId: string) => {
    setFormData((prev) => ({ ...prev, icon: iconId }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  // Encontrar o ícone selecionado
  const selectedIcon = lucideIcons.find(icon => icon.id === formData.icon);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1D24] rounded-lg w-full max-w-md shadow-xl text-white">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h2 className="text-lg font-medium">Adicionar um novo grupo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Nome do grupo */}
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center">
              Nome <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2.5 bg-[#0F1115] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white"
              placeholder="Digite para criar um novo grupo"
              required
            />
          </div>

          {/* Personalização */}
          <div className="space-y-4">
            <label className="text-sm font-medium">Personalize seu ícone</label>
            
            {/* Preview do ícone */}
            <div className="flex justify-center mb-4">
              <div
                className={`w-20 h-20 ${formData.color} rounded-2xl flex items-center justify-center text-white`}
              >
                {selectedIcon?.icon}
              </div>
            </div>

            {/* Seção de Ícones */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400">Ícones</h3>
              <div className="grid grid-cols-8 gap-2">
                {lucideIcons.map((iconOption) => (
                  <button
                    key={iconOption.id}
                    type="button"
                    onClick={() => handleIconSelect(iconOption.id)}
                    className={`w-8 h-8 flex items-center justify-center border border-gray-700 rounded hover:bg-[#0F1115] ${
                      formData.icon === iconOption.id ? 'bg-[#0F1115] ring-2 ring-blue-500' : ''
                    } text-gray-300 transition-transform hover:scale-110 duration-150`}
                  >
                    {iconOption.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Seção de Cores */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-400">Cores</h3>
              <div className="grid grid-cols-8 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`w-6 h-6 rounded-full ${color} ${
                      formData.color === color ? 'ring-2 ring-offset-2 ring-blue-500 ring-offset-[#1A1D24]' : ''
                    } transition-transform hover:scale-125 duration-150`}
                  ></button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 space-x-3 border-t border-gray-700 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#0F1115] text-gray-300 rounded-lg hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 