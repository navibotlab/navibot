import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentação - Navibot Platform',
  description: 'Documentação completa da plataforma Navibot',
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
        {/* Anti-cache meta tags */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      {children}
    </div>
  );
} 