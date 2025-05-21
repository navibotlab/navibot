import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface TutorialProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function Tutorial({ isOpen, onOpenChange }: TutorialProps) {
  const VIDEO_ID = "E8fGCABMhSk"; // Substitua por um ID de vídeo real do YouTube
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1D24] border-gray-800 max-w-2xl max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] overflow-hidden p-4 sm:p-6">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-white text-lg sm:text-xl">
            Como conectar o Dispara Já
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            Veja como integrar seu WhatsApp com o Dispara Já.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4 overflow-y-auto pr-2 max-h-[calc(90vh-100px)] sm:max-h-[calc(85vh-120px)] md:max-h-[calc(80vh-120px)]">
          <div className="rounded-md overflow-hidden aspect-video w-full">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${VIDEO_ID}`}
              title="Tutorial Dispara Já"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
          
          <div className="space-y-3 px-1">
            <h3 className="text-lg font-semibold text-white">Passos para conectar:</h3>
            <ol className="space-y-2 text-gray-300 list-decimal pl-4 sm:pl-5 text-sm sm:text-base">
              <li>
                <span className="font-semibold">Obtenha suas credenciais</span>: 
                Acesse o painel do Dispara Já em <a href="https://disparaja.com/dashboard" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">disparaja.com/dashboard</a> e crie ou copie seu Secret.
              </li>
              <li>
                <span className="font-semibold">Cadastre suas informações</span>: 
                Clique em "Nova Conexão", selecione o agente, informe o Secret do Dispara Já e o número de telefone com código do país.
              </li>
              <li>
                <span className="font-semibold">Escaneie o QR Code</span>: 
                Clique no botão "Conectar" e escaneie o QR Code que aparecerá usando seu aplicativo WhatsApp.
              </li>
              <li>
                <span className="font-semibold">Aguarde a confirmação</span>: 
                Após escanear, aguarde a confirmação de conexão. O processo leva aproximadamente 30 segundos.
              </li>
            </ol>
            
            <div className="bg-gray-800/50 p-2.5 sm:p-3 rounded-md mt-3">
              <h4 className="text-yellow-400 font-medium mb-1.5 sm:mb-2">Importante:</h4>
              <ul className="text-gray-300 list-disc pl-4 space-y-1.5 text-sm sm:text-base">
                <li>Certifique-se de que seu telefone tenha uma conexão estável com a internet.</li>
                <li>É necessário que o WhatsApp esteja instalado no seu telefone e que a conta esteja ativa.</li>
                <li>Cada número de telefone só pode ser conectado a uma única instância.</li>
                <li>Se você encontrar problemas, consulte a <a href="https://disparaja.com/dashboard/docs" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">documentação oficial do Dispara Já</a>.</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 