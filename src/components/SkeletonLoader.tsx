export function SkeletonLoader() {
  return (
    <div className="w-full h-full p-8 animate-pulse space-y-8">
      {/* Hero Skeleton */}
      <div className="w-full h-[400px] bg-white/5 rounded-[3rem] border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skeleton-shine"></div>
        <div className="absolute bottom-16 left-16 space-y-4 w-1/2">
          <div className="h-4 w-24 bg-white/10 rounded-full"></div>
          <div className="h-16 w-3/4 bg-white/10 rounded-2xl"></div>
          <div className="h-8 w-1/2 bg-white/10 rounded-xl"></div>
          <div className="flex gap-4 mt-8">
            <div className="h-14 w-40 bg-white/10 rounded-full"></div>
            <div className="h-14 w-14 bg-white/10 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded-lg"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="aspect-square bg-white/5 rounded-[2rem] border border-white/5"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
