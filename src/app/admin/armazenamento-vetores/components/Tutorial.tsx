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
            Como usar o armazenamento de vetores
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            Veja como criar e gerenciar bases de conhecimento vetoriais para sua IA.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4 overflow-y-auto pr-2 max-h-[calc(90vh-100px)] sm:max-h-[calc(85vh-120px)] md:max-h-[calc(80vh-120px)]">
          <div className="rounded-md overflow-hidden aspect-video w-full">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${VIDEO_ID}`}
              title="Tutorial de Armazenamento de Vetores"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
          
          <div className="space-y-3 px-1">
            <h3 className="text-lg font-semibold text-white">Como utilizar armazenamento de vetores:</h3>
            <ol className="space-y-2 text-gray-300 list-decimal pl-4 sm:pl-5 text-sm sm:text-base">
              <li>
                <span className="font-semibold">Crie uma base de conhecimento</span>: 
                Clique no botão "Criar Base de Conhecimento" e dê um nome para sua nova base.
              </li>
              <li>
                <span className="font-semibold">Adicione arquivos</span>: 
                Selecione os arquivos que deseja incluir na base de conhecimento para serem processados.
              </li>
              <li>
                <span className="font-semibold">Gerencie as bases</span>: 
                Cada base pode conter múltiplos arquivos e documentos relacionados a um mesmo tema.
              </li>
              <li>
                <span className="font-semibold">Vincule aos agentes</span>: 
                Associe as bases de conhecimento aos seus agentes para que eles possam utilizá-las nas respostas.
              </li>
            </ol>
            
            <div className="bg-gray-800/50 p-2.5 sm:p-3 rounded-md mt-3">
              <h4 className="text-yellow-400 font-medium mb-1.5 sm:mb-2">Importante:</h4>
              <ul className="text-gray-300 list-disc pl-4 space-y-1.5 text-sm sm:text-base">
                <li>O processamento de grandes arquivos pode levar alguns minutos para ser concluído.</li>
                <li>Bases de conhecimento são automaticamente indexadas para consulta rápida.</li>
                <li>Para melhores resultados, agrupe documentos relacionados na mesma base de conhecimento.</li>
                <li>Você pode adicionar novos arquivos a uma base existente a qualquer momento.</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 