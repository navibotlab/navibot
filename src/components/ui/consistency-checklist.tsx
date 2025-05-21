/**
 * CHECKLIST DE CONSISTÊNCIA VISUAL E UX
 * Esse arquivo serve como referência para garantir consistência entre todas as páginas
 * da área de configurações de contato.
 */

// Espaçamento e Padding
export const PADDINGS = {
  page: 'p-6', // Padding padrão para todas as páginas
  section: 'mb-6', // Espaçamento entre seções
  card: 'p-4', // Padding para cards
};

// Cores
export const COLORS = {
  background: {
    page: 'bg-[#0F1115]',
    card: 'bg-[#1A1D24]',
    input: 'bg-[#0F1115]',
    button: {
      primary: 'bg-blue-600 hover:bg-blue-500',
      secondary: 'bg-[#1A1D24] hover:bg-[#2A2D34]',
      destructive: 'bg-red-600 hover:bg-red-500',
    },
  },
  text: {
    primary: 'text-white',
    secondary: 'text-gray-400',
    destructive: 'text-red-400',
  },
  border: {
    card: 'border-gray-800',
    input: 'border-gray-800',
    destructive: 'border-red-800',
  },
  statusBadges: {
    success: 'bg-green-900/30 text-green-400',
    error: 'bg-red-900/30 text-red-400',
    warning: 'bg-yellow-900/30 text-yellow-400',
    info: 'bg-blue-900/30 text-blue-400',
    default: 'bg-gray-800 text-gray-400',
  },
};

// Tamanhos de texto
export const TEXT_SIZES = {
  headingLarge: 'text-2xl font-bold',
  headingMedium: 'text-xl font-medium',
  headingSmall: 'text-lg font-medium',
  body: 'text-base',
  small: 'text-sm',
  xsmall: 'text-xs',
};

// Raios de borda
export const BORDER_RADIUS = {
  card: 'rounded-lg',
  button: 'rounded-md',
  input: 'rounded-md',
  badge: 'rounded',
};

// Componentes padronizados
export const COMPONENT_CLASSES = {
  // Layout padrão de página
  pageLayout: 'p-6 bg-[#0F1115]',
  
  // Cabeçalho de página padrão
  pageHeader: 'flex justify-between items-center mb-6',
  pageTitle: 'text-2xl font-bold text-white',
  
  // Botões
  buttonPrimary: 'bg-blue-600 text-white hover:bg-blue-500',
  buttonOutline: 'bg-[#1A1D24] border-gray-800 text-gray-400 hover:text-white hover:bg-[#2A2D34]',
  buttonDestructive: 'bg-red-600 text-white hover:bg-red-500',
  buttonIcon: 'flex items-center gap-2',
  
  // Inputs
  inputBase: 'bg-[#0F1115] border-gray-800 text-white',
  searchInput: 'pl-10 bg-[#1A1D24] border-gray-800 text-white',
  
  // Cards
  cardBase: 'bg-[#1A1D24] border border-gray-800 rounded-lg',
  
  // Estado vazio
  emptyState: 'bg-[#1A1D24] border border-gray-800 rounded-lg p-8 text-center',
  emptyStateIcon: 'h-12 w-12 mx-auto mb-4 text-gray-400',
  emptyStateTitle: 'text-xl font-medium text-white mb-2',
  emptyStateText: 'text-gray-400 mb-4',
  
  // Loading
  loadingState: 'flex justify-center items-center h-64',
  loadingSpinner: 'h-8 w-8 animate-spin text-primary',
  
  // Diálogos
  dialogContent: 'bg-[#1A1D24] border-gray-800 text-white',
  
  // Mensagens de confirmação/feedback
  alertSuccess: 'border-green-600 bg-green-950/30 text-green-300',
  alertWarning: 'border-yellow-600 bg-yellow-950/30 text-yellow-300',
  alertError: 'border-red-600 bg-red-950/30 text-red-300',
  alertInfo: 'border-blue-600 bg-blue-950/30 text-blue-300',
};

// Lista de verificação para garantir consistência
export const UX_CHECKLIST = [
  {
    category: 'Layout',
    items: [
      'Todas as páginas usam o mesmo padding (p-6)',
      'Espaçamento entre seções é consistente (mb-6)',
      'Layout responsivo funciona em todos os tamanhos de tela',
      'Menu lateral mantém seleção ativa na página atual',
      'Transições entre páginas são suaves',
    ],
  },
  {
    category: 'Cores',
    items: [
      'Cores de fundo são consistentes entre páginas',
      'Cores de texto seguem hierarquia visual',
      'Cores de destaque (azul para ações primárias) são consistentes',
      'Cores de feedback (vermelho, verde, amarelo) seguem padrão',
      'Contraste entre texto e fundo é adequado para acessibilidade',
    ],
  },
  {
    category: 'Tipografia',
    items: [
      'Tamanhos de texto seguem hierarquia visual consistente',
      'Peso das fontes (font-bold, font-medium) é usado consistentemente',
      'Espaçamento entre linhas é adequado para legibilidade',
    ],
  },
  {
    category: 'Interação',
    items: [
      'Todos os botões têm hover states consistentes',
      'Feedback visual para ações (loading, sucesso, erro)',
      'Animações e transições são sutis e consistentes',
      'Confirmação para ações destrutivas (excluir)',
      'Tooltips/títulos em botões de ação sem texto',
    ],
  },
  {
    category: 'Formulários',
    items: [
      'Inputs têm aparência visual consistente',
      'Validação de formulários com feedback visual',
      'Labels posicionados consistentemente',
      'Campos obrigatórios são claramente indicados',
      'Botões de submit/cancel posicionados consistentemente',
    ],
  },
  {
    category: 'Estados',
    items: [
      'Estado vazio (sem dados) é tratado consistentemente',
      'Estado de carregamento (loading) é consistente',
      'Estado de erro é tratado e comunicado adequadamente',
      'Paginação (quando aplicável) é consistente',
    ],
  },
  {
    category: 'Acessibilidade',
    items: [
      'Contraste de cores atende padrões WCAG',
      'Todos os elementos interativos são acessíveis por teclado',
      'Ícones têm texto alternativo ou tooltips',
      'Formulários usam labels apropriadamente',
      'Mensagens de erro são claras e descritivas',
    ],
  },
]; 