'use client';

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Database, Bookmark, Notebook, Contact, Cpu} from 'lucide-react';

interface MenuOption {
  name: string;
  path: string;
  icon: ReactNode;
}

// Opções do menu lateral
const menuOptions: MenuOption[] = [
  { 
    name: 'Campos Personalizados', 
    path: '/admin/conteudos/configuracoes-contato/campos-contato',
    icon: <Contact className="h-4 w-4" />
  },
  { 
    name: 'Campos do Sistema', 
    path: '/admin/conteudos/configuracoes-contato/campos-sistema',
    icon: <Cpu className="h-4 w-4" />
  },
  { 
    name: 'Etiquetas', 
    path: '/admin/conteudos/configuracoes-contato/etiquetas',
    icon: <Bookmark className="h-4 w-4" />
  },
  { 
    name: 'Notas', 
    path: '/admin/conteudos/configuracoes-contato/notas',
    icon: <Notebook className="h-4 w-4" />
  },
];

export default function ConfiguracoesContatoLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#0F1115]">
        {/* Anti-cache meta tags */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      {/* Menu lateral mobile - Header com botão toggle */}
      <div className="md:hidden p-4 bg-[#1A1D24] border-b border-gray-800">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center justify-between w-full text-white px-4 py-2 rounded-md bg-[#0F1115] hover:bg-[#2A2D34]"
        >
          <span>Menu</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 transition-transform ${isMobileMenuOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Menu lateral */}
      <aside
        className={cn(
          "md:w-1/3 lg:w-1/4 xl:w-1/5 bg-[#1A1D24] border-r border-gray-800 overflow-y-auto",
          isMobileMenuOpen ? "block" : "hidden md:block"
        )}
      >
        <nav className="p-4">
          <div className="space-y-1">
            {menuOptions.map((option) => (
              <Link
                key={option.path}
                href={option.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-colors",
                  pathname === option.path
                    ? "bg-[#0F1115] text-white"
                    : "text-gray-400 hover:text-white hover:bg-[#0F1115]"
                )}
              >
                {option.icon}
                <span>{option.name}</span>
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
} 