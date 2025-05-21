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
            Como gerenciar arquivos de IA
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            Veja como fazer upload e gerenciar arquivos para treinamento de IA.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4 overflow-y-auto pr-2 max-h-[calc(90vh-100px)] sm:max-h-[calc(85vh-120px)] md:max-h-[calc(80vh-120px)]">
          <div className="rounded-md overflow-hidden aspect-video w-full">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${VIDEO_ID}`}
              title="Tutorial de Arquivos de IA"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
          
          <div className="space-y-3 px-1">
            <h3 className="text-lg font-semibold text-white">Como utilizar arquivos para IA:</h3>
            <ol className="space-y-2 text-gray-300 list-decimal pl-4 sm:pl-5 text-sm sm:text-base">
              <li>
                <span className="font-semibold">Adicione novos arquivos</span>: 
                Clique no botão "Adicionar Arquivo" e faça upload de documentos para treinar sua IA.
              </li>
              <li>
                <span className="font-semibold">Formatos suportados</span>: 
                Arquivos de texto (.txt), documentos (.doc, .docx) e PDFs (.pdf) são suportados.
              </li>
              <li>
                <span className="font-semibold">Visualize o conteúdo</span>: 
                Clique em um arquivo para visualizar seu conteúdo antes de usá-lo para treinamento.
              </li>
              <li>
                <span className="font-semibold">Gerenciamento de arquivos</span>: 
                Exclua arquivos que não são mais necessários ou organize-os conforme necessário.
              </li>
            </ol>
            
            <div className="bg-gray-800/50 p-2.5 sm:p-3 rounded-md mt-3">
              <h4 className="text-yellow-400 font-medium mb-1.5 sm:mb-2">Importante:</h4>
              <ul className="text-gray-300 list-disc pl-4 space-y-1.5 text-sm sm:text-base">
                <li>Arquivos grandes podem levar mais tempo para serem processados.</li>
                <li>Arquivos são automaticamente processados para extração de texto e dados relevantes.</li>
                <li>Documentos bem estruturados resultam em melhor treinamento da IA.</li>
                <li>Você pode arrastar e soltar arquivos para fazer upload mais rapidamente.</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 