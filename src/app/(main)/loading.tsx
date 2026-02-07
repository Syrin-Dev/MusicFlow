export default function Loading() {
  return (
    <div className="w-full h-full flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-[#8B5CF6] rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-sm font-medium animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
