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
            Como gerenciar seus agentes
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            Veja como criar e configurar seus agentes de forma eficiente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4 overflow-y-auto pr-2 max-h-[calc(90vh-100px)] sm:max-h-[calc(85vh-120px)] md:max-h-[calc(80vh-120px)]">
          <div className="rounded-md overflow-hidden aspect-video w-full">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${VIDEO_ID}`}
              title="Tutorial de Agentes"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
          
          <div className="space-y-3 px-1">
            <h3 className="text-lg font-semibold text-white">Como utilizar agentes:</h3>
            <ol className="space-y-2 text-gray-300 list-decimal pl-4 sm:pl-5 text-sm sm:text-base">
              <li>
                <span className="font-semibold">Crie um novo agente</span>: 
                Clique no botão "Criar Agente" no canto superior direito da tela e preencha as informações básicas.
              </li>
              <li>
                <span className="font-semibold">Configure seu agente</span>: 
                Defina nome, descrição, imagem e capacidades específicas para que ele atenda às suas necessidades.
              </li>
              <li>
                <span className="font-semibold">Treine com conhecimento</span>: 
                Adicione informações e documentos para que seu agente aprenda e possa responder perguntas específicas.
              </li>
              <li>
                <span className="font-semibold">Gerencie os agentes</span>: 
                Monitore o desempenho, edite configurações e exclua agentes que não são mais necessários.
              </li>
            </ol>
            
            <div className="bg-gray-800/50 p-2.5 sm:p-3 rounded-md mt-3">
              <h4 className="text-yellow-400 font-medium mb-1.5 sm:mb-2">Importante:</h4>
              <ul className="text-gray-300 list-disc pl-4 space-y-1.5 text-sm sm:text-base">
                <li>Agentes podem ser integrados a diversos canais de comunicação para atendimento.</li>
                <li>Os agentes utilizam IA para responder perguntas e interagir com usuários.</li>
                <li>É possível configurar regras específicas para cada agente.</li>
                <li>Mantenha a base de conhecimento do agente atualizada para melhores resultados.</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 