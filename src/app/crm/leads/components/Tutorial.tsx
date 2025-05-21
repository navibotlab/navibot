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
            Como gerenciar seus contatos
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            Veja como criar, importar e gerenciar contatos no sistema.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4 overflow-y-auto pr-2 max-h-[calc(90vh-100px)] sm:max-h-[calc(85vh-120px)] md:max-h-[calc(80vh-120px)]">
          <div className="rounded-md overflow-hidden aspect-video w-full">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${VIDEO_ID}`}
              title="Tutorial de Gerenciamento de Contatos"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
          
          <div className="space-y-3 px-1">
            <h3 className="text-lg font-semibold text-white">Como gerenciar contatos:</h3>
            <ol className="space-y-2 text-gray-300 list-decimal pl-4 sm:pl-5 text-sm sm:text-base">
              <li>
                <span className="font-semibold">Criar um novo contato</span>: 
                Clique no botão "Criar Contato" e preencha as informações de nome e telefone.
              </li>
              <li>
                <span className="font-semibold">Importar lista de contatos</span>: 
                Utilize o botão "Importar Contatos" para carregar uma lista em formato CSV ou Excel.
              </li>
              <li>
                <span className="font-semibold">Gerenciar contatos existentes</span>: 
                Edite, exclua ou selecione vários contatos para ações em massa.
              </li>
              <li>
                <span className="font-semibold">Buscar contatos</span>: 
                Use a barra de pesquisa para encontrar contatos específicos por nome ou telefone.
              </li>
            </ol>
            
            <div className="bg-gray-800/50 p-2.5 sm:p-3 rounded-md mt-3">
              <h4 className="text-yellow-400 font-medium mb-1.5 sm:mb-2">Importante:</h4>
              <ul className="text-gray-300 list-disc pl-4 space-y-1.5 text-sm sm:text-base">
                <li>Os números de telefone devem incluir o código do país (Ex: +55).</li>
                <li>Para importação em massa, certifique-se de usar o modelo de planilha correto.</li>
                <li>Contatos podem ser usados em campanhas de mensagem e associados a agentes.</li>
                <li>É possível exportar sua lista de contatos para backup ou uso em outras ferramentas.</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 