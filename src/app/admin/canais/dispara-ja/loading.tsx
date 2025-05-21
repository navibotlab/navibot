export default function Loading() {
  return (
    <div className="h-full">
      <div className="max-w-[1800px] mx-auto px-8">
        {/* Cabeçalho com título e botões principais */}
        <div className="flex items-center justify-between py-6">
          <div className="h-8 w-48 bg-gray-800 animate-pulse rounded"></div>
          <div className="flex gap-2">
            <div className="h-10 w-10 bg-gray-800 animate-pulse rounded"></div>
            <div className="h-10 w-32 bg-gray-800 animate-pulse rounded"></div>
          </div>
        </div>

        {/* Barra de ferramentas */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 flex items-center gap-3">
            <div className="h-7 w-7 bg-gray-800 animate-pulse rounded"></div>
            <div className="h-7 w-64 bg-gray-800 animate-pulse rounded"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-7 w-7 bg-gray-800 animate-pulse rounded"></div>
          </div>
        </div>

        {/* Lista de conexões */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-gray-800 overflow-hidden">
              <div className="h-2 w-full bg-gray-800 animate-pulse"></div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="h-6 w-32 bg-gray-800 animate-pulse rounded"></div>
                  <div className="h-6 w-20 bg-gray-800 animate-pulse rounded"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-800 animate-pulse rounded"></div>
                    <div className="h-4 w-24 bg-gray-800 animate-pulse rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-800 animate-pulse rounded"></div>
                    <div className="h-4 w-24 bg-gray-800 animate-pulse rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 