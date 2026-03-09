export default function RightPanel() {
  return (
    <aside className="hidden xl:block w-80 h-screen sticky top-0 bg-noctvm-black border-l border-noctvm-border p-6 overflow-y-auto">
      {/* Map placeholder */}
      <div className="rounded-xl overflow-hidden mb-6 border border-noctvm-border">
        <div className="aspect-square bg-noctvm-midnight flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-noctvm-violet/10 flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-noctvm-violet" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <p className="text-noctvm-silver text-xs">Map coming soon</p>
            <p className="text-noctvm-silver/50 text-[10px] mt-1">Bucharest venues</p>
          </div>
        </div>
      </div>

      {/* Trending venues */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-white mb-3">Trending Venues</h3>
        <div className="space-y-2">
          {['Control Club', 'Nook Club', 'Club Guesthouse', 'Platforma Wolff', 'Beraria H'].map((venue) => (
            <div
              key={venue}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-noctvm-surface border border-noctvm-border hover:border-noctvm-violet/30 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-noctvm-midnight flex items-center justify-center flex-shrink-0">
                <span className="text-noctvm-violet text-xs font-heading font-bold">{venue[0]}</span>
              </div>
              <div>
                <p className="text-xs font-medium text-white">{venue}</p>
                <p className="text-[10px] text-noctvm-silver">Bucharest</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tonight highlight */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-noctvm-midnight to-noctvm-black border border-noctvm-violet/20">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-noctvm-emerald live-pulse"></span>
          <span className="text-[10px] uppercase tracking-widest text-noctvm-emerald font-mono font-medium">Live Tonight</span>
        </div>
        <p className="text-xs text-noctvm-silver">
          Events happening right now in Bucharest
        </p>
      </div>
    </aside>
  );
}
