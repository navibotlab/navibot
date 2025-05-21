export default function DiagnosticoLoading() {
  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Carregando Diagnóstico</h1>
      
      <div className="bg-gray-800 p-6 rounded-md mb-6">
        <div className="flex items-center">
          <div className="w-8 h-8 mr-4">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div>
            <p className="text-lg">Coletando informações do sistema...</p>
            <p className="text-sm text-gray-400">Isso pode levar alguns segundos.</p>
          </div>
        </div>
      </div>
      
      <div className="bg-yellow-900/20 border border-yellow-600 p-4 rounded-md mb-4">
        <h2 className="text-lg font-semibold text-yellow-400">⚠️ Dica</h2>
        <p className="text-yellow-300">Se a página não carregar em alguns segundos, tente limpar os cookies do seu navegador e tentar novamente.</p>
      </div>
      
      <div className="bg-gray-800/50 p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Alternativas</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Acesse diretamente a <a href="/login" className="text-blue-400 hover:underline">página de login</a></li>
          <li>Limpe os cookies do seu navegador manualmente</li>
          <li>Tente em outro navegador ou dispositivo</li>
        </ul>
      </div>
    </div>
  );
} 