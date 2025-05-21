'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Users, BarChart3, SlidersHorizontal, Filter, HelpCircle, Rocket, Heart, Home, Plus, Settings, ChevronDown, ChevronRight, KeyRound, QrCode, ChevronLeft, Database, Folder, Bot, BookOpen } from 'lucide-react';
import { BsWhatsapp } from 'react-icons/bs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { FaInstagram } from "react-icons/fa";
import { MdViewKanban } from "react-icons/md";
import { TbLayoutKanban } from "react-icons/tb";
import { BiColumns } from "react-icons/bi";
import Image from 'next/image';

interface SidebarProps {
  onToggle?: (expanded: boolean) => void;
}

// Componente de tooltip personalizado
const Tooltip = ({ children, text, visible }: { children: React.ReactNode; text: string; visible: boolean }) => {
  if (!visible) return <>{children}</>;
  
  // Função para posicionar o tooltip
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (childRef.current && visible) {
      const rect = childRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 10
      });
    }
  }, [visible]);
  
  return (
    <div className="relative" ref={childRef}>
      {children}
      <div 
        ref={tooltipRef}
        className="fixed z-[9999] whitespace-nowrap rounded-md bg-white px-3 py-2 text-sm text-gray-800 shadow-md"
        style={{ 
          top: `${tooltipPosition.top}px`, 
          left: `${tooltipPosition.left}px`,
          transform: 'translateY(-50%)'
        }}
      >
        {text}
      </div>
    </div>
  );
};

export function Sidebar({ onToggle }: SidebarProps) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Notificar o componente pai quando o estado mudar
  useEffect(() => {
    if (onToggle) {
      onToggle(isExpanded);
    }
  }, [isExpanded, onToggle]);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  // Função para renderizar um item de menu com tooltip quando necessário
  const renderMenuItem = (
    href: string,
    icon: React.ReactNode,
    text: string,
    isActive: boolean,
    id: string
  ) => {
    const content = (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 py-2 text-sm rounded-lg",
          isExpanded ? "px-3" : "px-2 justify-center",
          isActive
            ? 'bg-[#1A1D24] text-white'
            : 'text-gray-400 hover:text-white hover:bg-[#1A1D24]'
        )}
        onMouseEnter={() => setHoveredItem(id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        {icon}
        {isExpanded && text}
      </Link>
    );

    if (!isExpanded && hoveredItem === id) {
      return <Tooltip text={text} visible={!isExpanded}>{content}</Tooltip>;
    }

    return content;
  };

  return (
    <>
      {/* Botão de toggle isolado usando position fixed */}
      <div 
        className="fixed"
        style={{ 
          top: '1rem', 
          left: isExpanded ? '15rem' : '4.5rem',
          zIndex: 99999,
          transition: 'left 0.3s ease'
        }}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 bg-[#0F1115] border border-gray-800 shadow-md text-gray-400 hover:text-white hover:bg-gray-800"
          onClick={toggleSidebar}
        >
          {isExpanded ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </Button>
      </div>

      <aside className={cn(
        "bg-[#0F1115] border-r border-gray-800 flex flex-col transition-all duration-300 h-screen overflow-hidden flex-shrink-0 relative",
        isExpanded ? "w-64" : "w-20"
      )}>
        {/* Logo */}
        <div className="h-16 min-h-[4rem] flex border-b border-gray-800 flex-shrink-0 relative z-[65]">
          {/* Área do logo */}
          <div className={cn(
            "w-full flex items-center",
            isExpanded ? "justify-start pl-6" : "justify-center"
          )}>
            {isExpanded ? (
              <Image 
                src="/images/navibot-logo-clara.png" 
                alt="Navibot Logo" 
                width={140} 
                height={32}
                className="h-8 w-auto" 
                priority
              />
            ) : (
              <Image 
                src="/images/icon-navibot-clara.png" 
                alt="Navibot Icon" 
                width={42} 
                height={42}
                className="h-10 w-10" 
                priority
              />
            )}
          </div>
        </div>

        {/* Menu */}
        <nav className={cn(
          "flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent",
          isExpanded ? "px-6 py-4" : "px-3 py-3"
        )}>
          <div className="space-y-6 pb-20">
            {/* Dashboard - Nova seção */}
            <div>            
              <div className="space-y-1">
                {renderMenuItem(
                  "/admin",
                  <BarChart3 className="h-4 w-4" />,
                  "Dashboard",
                  pathname === '/admin',
                  "dashboard"
                )}
              </div>
            </div>

            {/* Gestão de Agentes */}
            <div>
              {isExpanded && (
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  GESTÃO DE AGENTES
                </h2>
              )}
              <div className="space-y-1">
                {renderMenuItem(
                  "/admin/agentes",
                  <Bot className="h-4 w-4" />,
                  "Agentes de IA",
                  pathname === '/admin/agentes',
                  "agentes-ia"
                )}
                {/* Funções de IA com badge "em breve" */}
                {!isExpanded && hoveredItem === "funcoes-ia" ? (
                  <Tooltip text="Funções de IA" visible={!isExpanded}>
                    <div 
                      className={cn(
                        "flex items-center gap-3 py-2 text-sm text-gray-400",
                        isExpanded ? "px-3" : "px-2 justify-center"
                      )}
                      onMouseEnter={() => setHoveredItem("funcoes-ia")}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <Rocket className="h-4 w-4" />
                    </div>
                  </Tooltip>
                ) : (
                  <div 
                    className={cn(
                      "flex items-center gap-3 py-2 text-sm text-gray-400",
                      isExpanded ? "px-3" : "px-2 justify-center"
                    )}
                    onMouseEnter={() => setHoveredItem("funcoes-ia")}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <Rocket className="h-4 w-4" />
                    {isExpanded && (
                      <>
                        Funções
                        <span className="ml-auto text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">em breve</span>
                      </>
                    )}
                  </div>
                )}
                {renderMenuItem(
                  "/admin/arquivos-ia",
                  <Folder className="h-4 w-4" />,
                  "Arquivos de IA",
                  pathname === '/admin/arquivos-ia',
                  "arquivos-ia"
                )}
                {renderMenuItem(
                  "/admin/armazenamento-vetores",
                  <Database className="h-4 w-4" />,
                  "Armazenamento de Vetores",
                  pathname === '/admin/armazenamento-vetores',
                  "armazenamento-vetores"
                )}
              </div>
            </div>

            {/* CRM */}
            <div>
              {isExpanded && (
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  CRM
                </h2>
              )}
              <div className="space-y-1">
                {renderMenuItem(
                  "/conversas",
                  <MessageSquare className="h-4 w-4" />,
                  "Chat Ao Vivo",
                  pathname === '/conversas',
                  "conversas"
                )}
                {renderMenuItem(
                  "/crm/leads",
                  <Users className="h-4 w-4" />,
                  "Ver contatos",
                  pathname === '/crm/leads',
                  "leads"
                )}
                {renderMenuItem(
                  "/crm/pipeline",
                  <BiColumns className="h-4 w-4" />,
                  "Pipeline Visual",
                  pathname === '/crm/pipeline',
                  "pipeline"
                )}
                
                {/* Item "Ver funil" com badge "em breve" */}
                {!isExpanded && hoveredItem === "funil" ? (
                  <Tooltip text="Ver funil" visible={!isExpanded}>
                    <div 
                      className={cn(
                        "flex items-center gap-3 py-2 text-sm text-gray-400",
                        isExpanded ? "px-3" : "px-2 justify-center"
                      )}
                      onMouseEnter={() => setHoveredItem("funil")}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <Filter className="h-4 w-4" />
                    </div>
                  </Tooltip>
                ) : (
                  <div 
                    className={cn(
                      "flex items-center gap-3 py-2 text-sm text-gray-400",
                      isExpanded ? "px-3" : "px-2 justify-center"
                    )}
                    onMouseEnter={() => setHoveredItem("funil")}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <Filter className="h-4 w-4" />
                    {isExpanded && (
                      <>
                        Ver funil
                        <span className="ml-auto text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">em breve</span>
                      </>
                    )}
                  </div>
                )}
                <div className="space-y-1">
                {renderMenuItem(
                  "/admin/conteudos/configuracoes-contato",
                  <SlidersHorizontal className="h-4 w-4" />,
                  "Configurações Gerais",
                  pathname.startsWith('/admin/conteudos/configuracoes-contato'),
                  "configuracoes-contato"
                )}
                </div>
              </div>
            </div>

            {/* Canais */}
            <div>
              {isExpanded && (
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  CANAIS
                </h2>
              )}
              <div className="space-y-1">
                {renderMenuItem(
                  "/admin/canais/whatsapp-cloud",
                  <BsWhatsapp className="h-4 w-4" />,
                  "Whatsapp Cloud API",
                  pathname === '/admin/canais/whatsapp-cloud',
                  "whatsapp-cloud"
                )}
                {renderMenuItem(
                  "/admin/canais/dispara-ja",
                  <Rocket className="h-4 w-4" />,
                  "Dispara Já",
                  pathname === '/admin/canais/dispara-ja',
                  "dispara-ja"
                )}
                {/* WhatsApp Z-API com badge "em breve" */}
                {!isExpanded && hoveredItem === "whatsapp-zapi" ? (
                  <Tooltip text="Whatsapp Z-API" visible={!isExpanded}>
                    <div 
                      className={cn(
                        "flex items-center gap-3 py-2 text-sm text-gray-400",
                        isExpanded ? "px-3" : "px-2 justify-center"
                      )}
                      onMouseEnter={() => setHoveredItem("whatsapp-zapi")}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <BsWhatsapp className="h-4 w-4" />
                    </div>
                  </Tooltip>
                ) : (
                  <div 
                    className={cn(
                      "flex items-center gap-3 py-2 text-sm text-gray-400",
                      isExpanded ? "px-3" : "px-2 justify-center"
                    )}
                    onMouseEnter={() => setHoveredItem("whatsapp-zapi")}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <BsWhatsapp className="h-4 w-4" />
                    {isExpanded && (
                      <>
                        Z-API
                        <span className="ml-auto text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">em breve</span>
                      </>
                    )}
                  </div>
                )}
                {/* Instragram com badge "em breve" */}
                {!isExpanded && hoveredItem === "instagram" ? (
                  <Tooltip text="Instagram" visible={!isExpanded}>
                    <div 
                      className={cn(
                        "flex items-center gap-3 py-2 text-sm text-gray-400",
                        isExpanded ? "px-3" : "px-2 justify-center"
                      )}
                      onMouseEnter={() => setHoveredItem("instagram")}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <FaInstagram className="h-4 w-4" />
                    </div>
                  </Tooltip>
                ) : (
                  <div 
                    className={cn(
                      "flex items-center gap-3 py-2 text-sm text-gray-400",
                      isExpanded ? "px-3" : "px-2 justify-center"
                    )}
                    onMouseEnter={() => setHoveredItem("instagram")}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <FaInstagram className="h-4 w-4" />
                    {isExpanded && (
                      <>
                        Instagram
                        <span className="ml-auto text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">em breve</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Conteúdos - Nova seção */}
            <div>
              {isExpanded && (
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  CONTEÚDOS
                </h2>
              )}            
            </div>        
            
            {/* Configurações */}
            <div>
              {isExpanded && (
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  CONFIGURAÇÕES
                </h2>
              )}
              <div className="space-y-1">
                {renderMenuItem(
                  "/admin/configuracoes/integracoes",
                  <KeyRound className="h-4 w-4" />,
                  "Integrações",
                  pathname === '/admin/configuracoes/integracoes',
                  "integracoes"
                )}
              </div>
            </div>

            {/* Ecossistema */}
            <div>
              {isExpanded && (
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  ECOSSISTEMA
                </h2>
              )}
              <div className="space-y-1">
                {renderMenuItem(
                  "/discord",
                  <Heart className="h-4 w-4" />,
                  "Comunidade no Discord",
                  pathname === '/discord',
                  "discord"
                )}
                {renderMenuItem(
                  "/aceleracao",
                  <Rocket className="h-4 w-4" />,
                  "Programa de Aceleração",
                  pathname === '/aceleracao',
                  "aceleracao"
                )}
                {renderMenuItem(
                  "/suporte",
                  <HelpCircle className="h-4 w-4" />,
                  "Suporte",
                  pathname === '/suporte',
                  "suporte"
                )}
              </div>
            </div>

            {/* Agregar enlace a la documentación */}
            {renderMenuItem('/docs', <BookOpen size={20} />, 'Documentação', pathname.includes('/docs'), 'docs')}
            
          </div>
        </nav>
      </aside>
    </>
  );
} 