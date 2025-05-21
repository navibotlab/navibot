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
            Como configurar o WhatsApp Cloud API
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            Veja como integrar o WhatsApp Business API com sua aplicação.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4 overflow-y-auto pr-2 max-h-[calc(90vh-100px)] sm:max-h-[calc(85vh-120px)] md:max-h-[calc(80vh-120px)]">
          <div className="rounded-md overflow-hidden aspect-video w-full">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${VIDEO_ID}`}
              title="Tutorial WhatsApp Cloud API"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
          
          <div className="space-y-3 px-1">
            <h3 className="text-lg font-semibold text-white">Como configurar WhatsApp Cloud API:</h3>
            <ol className="space-y-2 text-gray-300 list-decimal pl-4 sm:pl-5 text-sm sm:text-base">
              <li>
                <span className="font-semibold">Crie uma conta no Meta Business</span>: 
                Acesse o Meta for Developers e crie uma conta de desenvolvedor.
              </li>
              <li>
                <span className="font-semibold">Configure um app no Facebook Business</span>: 
                Adicione a integração WhatsApp ao seu aplicativo e configure os Webhooks.
              </li>
              <li>
                <span className="font-semibold">Obtenha as credenciais</span>: 
                Copie o Phone Number ID e seu token de acesso permanente para configurar a conexão.
              </li>
              <li>
                <span className="font-semibold">Adicione a conexão ao sistema</span>: 
                Clique em "Nova Conexão" e insira as credenciais obtidas no Meta Business.
              </li>
            </ol>
            
            <div className="bg-gray-800/50 p-2.5 sm:p-3 rounded-md mt-3">
              <h4 className="text-yellow-400 font-medium mb-1.5 sm:mb-2">Importante:</h4>
              <ul className="text-gray-300 list-disc pl-4 space-y-1.5 text-sm sm:text-base">
                <li>Você precisa ter uma conta verificada no Facebook Business.</li>
                <li>O número precisa ser um número empresarial verificado no WhatsApp Business.</li>
                <li>Os tokens de acesso são sensíveis e devem ser mantidos em segurança.</li>
                <li>Configure corretamente os Webhooks para receber mensagens e eventos em tempo real.</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 