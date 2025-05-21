import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect, useRef } from 'react';
import { Mic, Play, Pause, X, ZoomIn, ZoomOut } from 'lucide-react';

// Componentes personalizados para substituir o framer-motion
const AnimatedPresence = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Componente personalizado para substituir motion.div
const AnimatedDiv = ({ 
  children, 
  className = "", 
  onClick,
  initial = {},
  animate = {},
  exit = {},
  transition = {},
  style = {},
  ...props
}: { 
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
  style?: React.CSSProperties;
  [key: string]: any;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);
  
  let animationClassName = "";
  
  // Simplificando apenas para os casos que usamos
  if (initial?.opacity === 0 && animate?.opacity === 1) {
    animationClassName += " transition-opacity duration-200 " + (isVisible ? "opacity-100" : "opacity-0");
  }
  
  if (initial?.scale === 0.9 && animate?.scale === 1) {
    animationClassName += " transition-transform duration-200 " + (isVisible ? "scale-100" : "scale-90");
  }
  
  return (
    <div 
      className={`${className} ${animationClassName}`}
      onClick={onClick}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

interface MessageItemProps {
  content: string;
  sender: string;
  createdAt: string;
  type: 'text' | 'image' | 'audio';
  mediaUrl?: string | null;
  mediaDuration?: number;
  mediaType?: string;
  userName?: string;
  isManual?: boolean;
  agentName?: string;
}

export function MessageItem({ 
  content, 
  sender, 
  createdAt, 
  type, 
  mediaUrl,
  mediaDuration,
  mediaType,
  userName = 'Cliente',
  isManual = false,
  agentName = 'Assistente'
}: MessageItemProps) {
  const isAgent = sender === 'agent' || sender === 'assistant' || sender === 'human';
  const [imageError, setImageError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(mediaDuration || 0);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Estado para controlar a exibição do modal de imagem
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Atualiza a duração do áudio quando o componente é montado
  useEffect(() => {
    if (type === 'audio' && mediaUrl && audioRef.current) {
      const audio = audioRef.current;
      
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      // Se já estiver carregado
      if (audio.readyState >= 2) {
        setDuration(audio.duration);
      }
      
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [type, mediaUrl]);

  // Gerencia o estado de reprodução e atualiza o progresso
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handlePlay = () => {
        setIsPlaying(true);
        // Inicia um intervalo para atualizar o progresso
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        progressIntervalRef.current = setInterval(() => {
          setCurrentTime(audio.currentTime);
          setProgress((audio.currentTime / audio.duration) * 100);
        }, 100);
      };
      
      const handlePause = () => {
        setIsPlaying(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setProgress(0);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      };
      
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    }
  }, []);

  // Atualiza a velocidade de reprodução quando o valor de playbackRate mudar
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleTogglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Silenciando erro para não expor dados sensíveis
        audioRef.current.play().catch(() => {
          // Erro silenciado intencionalmente
        });
      }
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
  };

  const togglePlaybackRate = () => {
    // Alternar entre as velocidades: 1x -> 1.5x -> 2x -> 1x
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration > 0) {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      const newTime = clickPosition * duration;
      
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(clickPosition * 100);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const isValidImageUrl = (url?: string | null): url is string => {
    if (!url) return false;
    return url.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null;
  };

  // Verifica se o conteúdo é um ID interno do sistema
  const isInternalId = (text: string) => {
    if (text.startsWith('WhatsApp:') && text.length > 50) {
      return true;
    }
    return false;
  };

  // Se for um ID interno, não renderiza a mensagem
  if (isInternalId(content)) {
    return null;
  }

  // Define o nome a ser exibido com base no sender
  const displayName = sender === 'human' 
    ? 'Humano' 
    : isAgent 
        ? (isManual ? 'Humano' : agentName)
        : userName;

  const formatDate = (dateString: string, senderType: string) => {
    try {
      // Converter string para objeto Date
      const date = new Date(dateString);
      
      // Adicionar 3 horas para compensar o fuso horário UTC para o horário do Brasil (UTC-3)
      // Como os timestamps no banco estão sendo salvos com -3h, precisamos adicionar +3h na exibição
      const adjustedDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
      
      // Obter horas e minutos
      const hours = adjustedDate.getHours().toString().padStart(2, '0');
      const minutes = adjustedDate.getMinutes().toString().padStart(2, '0');
      
      return `${hours}:${minutes}`;
    } catch (error) {
      // Removendo log de erro para não expor dados sensíveis
      return '--:--';
    }
  };

  const handleImageClick = () => {
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  return (
    <>
      <div className={`flex ${isAgent ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`min-w-[200px] max-w-[70%] rounded-lg ${
          isAgent ? 'bg-blue-600 text-white' : 'bg-[#1A1D24] text-white'
        }`}>
          <div className={`px-3 pt-2 pb-1 border-b border-white/10 text-sm font-medium ${
            isAgent ? 'text-blue-200' : 'text-gray-300'
          }`}>
            {displayName}
          </div>
          <div className="p-3 pt-2">
            {type === 'image' && isValidImageUrl(mediaUrl) && !imageError ? (
              <div className="mb-2 min-w-[200px]">
                <div 
                  className="relative w-full aspect-video cursor-pointer overflow-hidden rounded-lg group"
                  onClick={handleImageClick}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10">
                    <div className="bg-black/40 p-2 rounded-full">
                      <ZoomIn className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <Image
                    src={mediaUrl}
                    alt="Imagem da mensagem"
                    fill
                    className="rounded-lg object-contain transition-transform group-hover:scale-105 duration-300"
                    onError={handleImageError}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                {content && <p className="mt-2">{content}</p>}
              </div>
            ) : type === 'audio' ? (
              <div className="mb-2 space-y-2">
                {mediaUrl ? (
                  <div className="flex flex-col gap-2 bg-gray-800/50 p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <button 
                        className="bg-blue-600 hover:bg-blue-500 transition-colors rounded-full p-4 flex-shrink-0 cursor-pointer"
                        onClick={handleTogglePlay}
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5 text-gray" />
                        ) : (
                          <Play className="h-5 w-5 text-white" />
                        )}
                      </button>
                      <div className="w-full relative">
                        <audio 
                          ref={audioRef} 
                          src={mediaUrl} 
                          className="hidden" 
                          preload="metadata"
                        />
                        <div 
                          className="w-full bg-gray-700 h-8 rounded-md flex items-center px-3 cursor-pointer overflow-hidden group"
                          onClick={handleProgressClick}
                        >
                          <div className="bg-blue-500/20 h-2 rounded-full absolute left-3 right-3"></div>
                          <div 
                            className="bg-blue-400 h-2 rounded-full absolute left-3 group-hover:bg-blue-300 transition-colors" 
                            style={{ width: `${progress}%` }}
                          ></div>
                          <div 
                            className="h-4 w-4 rounded-full bg-blue-400 ml-3 absolute group-hover:bg-blue-300 transition-colors"
                            style={{ left: `calc(${progress}% + 3px)`, transform: 'translateX(-50%)' }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-300 mt-1">
                          <span>{formatTime(currentTime)}</span>
                          <button
                            onClick={togglePlaybackRate}
                            className="bg-gray-700/50 text-white hover:bg-gray-600 rounded-full px-2.5 py-0.5 text-xs font-medium"
                          >
                            {playbackRate}x
                          </button>
                          <span>{duration > 0 ? formatTime(duration) : '00:00'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800/50 p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Áudio indisponível</span>
                    </div>
                  </div>
                )}
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-300">Transcrição do áudio recebido:</p>
                  <p className="whitespace-pre-wrap break-words text-white">{content}</p>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words">{content}</p>
            )}
          </div>
          <div className="px-3 pb-1 text-xs text-gray-400">
            {formatDate(createdAt, sender)}
          </div>
        </div>
      </div>

      {/* Modal de visualização de imagem */}
      <AnimatedPresence>
        {isImageModalOpen && isValidImageUrl(mediaUrl) && (
          <AnimatedDiv 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={closeImageModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AnimatedDiv 
              className="relative max-w-5xl max-h-[90vh] w-full h-full"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute top-2 right-2 z-10 flex gap-2">
                <button 
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors flex items-center justify-center"
                  onClick={closeImageModal}
                  title="Fechar"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="relative w-full h-full rounded-lg overflow-hidden">
                <Image
                  src={mediaUrl}
                  alt="Visualização ampliada"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
                  quality={100}
                  priority
                />
              </div>
            </AnimatedDiv>
          </AnimatedDiv>
        )}
      </AnimatedPresence>
    </>
  );
} 