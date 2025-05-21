export default function Loading() {
  return (
    <div className="h-full">
      <div className="max-w-[1800px] mx-auto px-8">
        <div className="flex items-center justify-between py-6">
          <div className="h-8 w-48 bg-gray-800 animate-pulse rounded"></div>
          <div className="flex gap-2">
            <div className="h-10 w-10 bg-gray-800 animate-pulse rounded"></div>
            <div className="h-10 w-32 bg-gray-800 animate-pulse rounded"></div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 flex items-center gap-3">
            <div className="h-7 w-7 bg-gray-800 animate-pulse rounded"></div>
            <div className="h-7 w-64 bg-gray-800 animate-pulse rounded"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-7 w-7 bg-gray-800 animate-pulse rounded"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-800 animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
} 