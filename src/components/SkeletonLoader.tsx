'use client';

export function MapSkeleton() {
  return (
    <div className="aspect-[21/9] w-full rounded-xl bg-noctvm-midnight/50 animate-pulse border border-white/5 flex flex-col items-center justify-center gap-2">
      <div className="w-6 h-6 border-2 border-noctvm-violet/20 border-t-noctvm-violet/40 rounded-full animate-spin" />
      <div className="h-2 w-24 bg-white/5 rounded-full" />
    </div>
  );
}

export function LiveTonightSkeleton() {
  return (
    <div className="p-3 rounded-xl bg-noctvm-midnight/30 border border-white/5 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-noctvm-silver/20" />
        <div className="h-3 w-20 bg-white/5 rounded-full" />
      </div>
      <div className="flex gap-2.5 overflow-hidden">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex-shrink-0 w-[140px] aspect-[3/2] rounded-lg bg-white/5" />
        ))}
      </div>
    </div>
  );
}

export function TrendingVenuesSkeleton() {
  return (
    <div className="p-3 rounded-xl bg-white/[0.01] border border-white/5 animate-pulse">
      <div className="h-3 w-24 bg-white/5 rounded-full mb-3" />
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 w-[65px]">
            <div className="w-11 h-11 rounded-full bg-white/5" />
            <div className="h-2 w-10 bg-white/5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SearchBarSkeleton() {
  return (
    <div className="rounded-2xl p-4 bg-noctvm-surface/40 border border-white/5 animate-pulse mb-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-10 rounded-xl bg-white/5" />
        <div className="w-20 h-10 rounded-xl bg-white/5" />
      </div>
      <div className="h-8 w-full rounded-xl bg-white/5" />
    </div>
  );
}
