import DocumentationViewer from './DocumentationViewer';

export default function DocsPage() {
  return <DocumentationViewer />;
}

// Configuración para servir archivos estáticos
export const dynamic = 'force-dynamic';
export const revalidate = 0; // No cachear esta página 