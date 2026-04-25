import { useEffect } from "react";
import {
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

type NoctvmDemoProps = {
  title: string;
  subtitle: string;
};

const SCENE_DURATIONS = [90, 90, 90] as const;

const EVENT_CARDS = [
  {
    source: "CTRL",
    title: "corp.: Admina, Chlorys & von Bulove",
    venue: "Control Club",
    time: "19:00",
    price: "FREE",
    accent: "rgba(124,58,237,1)",
  },
  {
    source: "GH",
    title: "GRAYZONE x VIPER",
    venue: "Club Guesthouse",
    time: "23:00",
    price: "35 - 45 RON",
    accent: "rgba(16,185,129,1)",
  },
  {
    source: "PW",
    title: "Misbits 13 Years Anniversary",
    venue: "Platforma Wolff",
    time: "22:00",
    price: "70 - 90 RON",
    accent: "rgba(212,168,67,1)",
  },
] as const;

const VENUE_ROWS = [
  { name: "Control Club", genre: "Techno / Live", count: "12 upcoming", score: "4.9" },
  { name: "Club Guesthouse", genre: "Underground / House", count: "9 upcoming", score: "4.8" },
  { name: "Platforma Wolff", genre: "Minimal / Techno", count: "8 upcoming", score: "4.7" },
  { name: "Nook Club", genre: "Bass / Underground", count: "6 upcoming", score: "4.6" },
] as const;

const REWARDS = [
  { title: "Create your account", points: "+500", desc: "Welcome bonus, one-time" },
  { title: "Share a post", points: "+10", desc: "Per post published" },
  { title: "Add a story", points: "+5", desc: "Per 24h story" },
  { title: "Review a venue", points: "+25", desc: "Per verified review" },
] as const;

function useNoctvmFonts() {
  useEffect(() => {
    const handle = delayRender("Loading NOCTVM fonts");

    if (typeof document === "undefined" || !document.fonts) {
      continueRender(handle);
      return;
    }

    void document.fonts.ready
      .catch(() => undefined)
      .then(() => continueRender(handle));
  }, []);
}

function sceneOpacity(frame: number, start: number, duration: number) {
  return interpolate(frame, [start, start + 12, start + duration - 12, start + duration], [0, 1, 1, 0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function sceneLift(frame: number, start: number) {
  return interpolate(frame, [start, start + 16], [24, 0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function chipClass(active?: boolean) {
  return active
    ? "border-noctvm-violet/30 bg-noctvm-violet/10 text-white"
    : "border-white/10 bg-white/5 text-white/55";
}

function AppSidebar() {
  return (
    <aside className="flex h-full w-[92px] flex-col items-center justify-between rounded-[30px] border border-white/10 bg-white/5 px-3 py-5 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6">
        <Img src={staticFile("images/logo.svg")} style={{ width: 28, height: 32, objectFit: "contain" }} />
        <div className="flex flex-col items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-noctvm-violet" />
          <div className="h-2 w-2 rounded-full bg-noctvm-emerald" />
          <div className="h-2 w-2 rounded-full bg-noctvm-gold" />
        </div>
      </div>

      <div className="flex w-full flex-1 flex-col items-center justify-center gap-2">
        {[
          ["Events", true],
          ["Venues", false],
          ["Feed", false],
          ["Pocket", false],
        ].map(([label, active]) => (
          <div
            key={label}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-[10px] uppercase tracking-[0.22em] ${active ? "border-noctvm-violet/30 bg-noctvm-violet/10 text-white" : "border-white/5 bg-black/25 text-white/45"}`}
          >
            {String(label).slice(0, 1)}
          </div>
        ))}
      </div>

      <div className="flex w-full flex-col items-center gap-3">
        <div className="h-11 w-11 overflow-hidden rounded-full border border-white/10 bg-black/40">
          <Img src={staticFile("images/typelogo-inside.webp")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <p style={{ fontFamily: "Satoshi, sans-serif" }} className="text-center text-[9px] uppercase tracking-[0.22em] text-white/45">
          Log in
        </p>
      </div>
    </aside>
  );
}

function EventCard({
  card,
  frame,
  offset,
}: {
  card: (typeof EVENT_CARDS)[number];
  frame: number;
  offset: number;
}) {
  const p = interpolate(frame, [offset, offset + 12], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const x = interpolate(frame, [offset, offset + 12], [18, 0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <article
      style={{ opacity: p, transform: `translateX(${x}px)` }}
      className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]"
    >
      <div className="grid grid-cols-[170px_minmax(0,1fr)] gap-4 p-4">
        <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-black/80">
          <Img src={staticFile("images/event-fallback.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.45))]" />
          <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 backdrop-blur-md">
            <p style={{ fontFamily: "Satoshi, sans-serif" }} className="text-[9px] uppercase tracking-[0.22em] text-white/70">
              {card.source}
            </p>
          </div>
          <div className="absolute bottom-3 right-3 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 backdrop-blur-md">
            <p style={{ fontFamily: "Satoshi, sans-serif" }} className="text-[9px] uppercase tracking-[0.22em] text-white/70">
              {card.price}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-between py-1 pr-1">
          <div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {card.source === "CTRL" ? ["Techno", "Live"] : card.source === "GH" ? ["Underground", "House"] : ["Minimal", "Nightlife"].map((item) => (
                <span
                  key={item}
                  className={`rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.22em] ${card.source === "GH" ? "border-noctvm-emerald/20 bg-noctvm-emerald/10 text-noctvm-emerald" : "border-white/10 bg-white/5 text-white/50"}`}
                >
                  {item}
                </span>
              ))}
            </div>
            <h3 style={{ fontFamily: "Freshid, sans-serif" }} className="max-w-[16ch] text-[26px] leading-[0.95] tracking-[-0.03em] text-[#F5F3F0]">
              {card.title}
            </h3>
            <p style={{ fontFamily: "Satoshi, sans-serif" }} className="mt-2 text-[12px] text-white/60">
              {card.venue}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-2 text-white/55">
              <div className="h-2 w-2 rounded-full" style={{ background: card.accent }} />
              <span style={{ fontFamily: "Satoshi, sans-serif" }} className="text-[11px] uppercase tracking-[0.2em]">
                {card.time}
              </span>
            </div>
            <button className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-white/65">
              Save
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function VenueRow({
  venue,
  frame,
  offset,
}: {
  venue: (typeof VENUE_ROWS)[number];
  frame: number;
  offset: number;
}) {
  const p = interpolate(frame, [offset, offset + 12], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(frame, [offset, offset + 12], [18, 0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <button
      style={{ opacity: p, transform: `translateX(${x}px)` }}
      className="flex w-full items-center gap-4 rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-left backdrop-blur-md"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-[10px] uppercase tracking-[0.24em] text-white/60">
        {venue.name.slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p style={{ fontFamily: "Satoshi, sans-serif" }} className="truncate text-[16px] font-medium text-white/90">
            {venue.name}
          </p>
          <div className="flex items-center gap-1 text-noctvm-gold">
            <span className="text-[11px]">★</span>
            <span style={{ fontFamily: "Satoshi, sans-serif" }} className="text-[11px] text-white/65">
              {venue.score}
            </span>
          </div>
        </div>
        <p style={{ fontFamily: "Satoshi, sans-serif" }} className="mt-1 text-[12px] text-white/55">
          {venue.genre}
        </p>
      </div>
      <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-white/55">
        {venue.count}
      </div>
    </button>
  );
}

function RewardTile({
  reward,
  frame,
  offset,
}: {
  reward: (typeof REWARDS)[number];
  frame: number;
  offset: number;
}) {
  const p = interpolate(frame, [offset, offset + 12], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [offset, offset + 12], [18, 0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{ opacity: p, transform: `translateY(${y}px)` }}
      className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur-md"
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p style={{ fontFamily: "Satoshi, sans-serif" }} className="text-[12px] font-medium text-white/85">
            {reward.title}
          </p>
          <p style={{ fontFamily: "Satoshi, sans-serif" }} className="mt-1 text-[11px] text-white/50">
            {reward.desc}
          </p>
        </div>
        <div className="rounded-full border border-noctvm-violet/20 bg-noctvm-violet/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-noctvm-violet">
          {reward.points}
        </div>
      </div>
      <div className="h-1 w-full rounded-full bg-white/6">
        <div className="h-1 rounded-full bg-[linear-gradient(90deg,rgba(124,58,237,1),rgba(212,168,67,1))]" style={{ width: "64%" }} />
      </div>
    </div>
  );
}

function AppShellScene({ frame, start, title, subtitle }: { frame: number; start: number; title: string; subtitle: string }) {
  const local = frame - start;
  return (
    <section
      style={{ opacity: sceneOpacity(frame, start, SCENE_DURATIONS[0]) }}
      className="absolute inset-0 overflow-hidden bg-[#050505] text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(124,58,237,0.18),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(212,168,67,0.12),transparent_22%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.12),transparent_28%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,rgba(0,0,0,0.2))]" />

      <div className="relative h-full p-8">
        <div className="grid h-full grid-cols-[92px_minmax(0,1fr)_344px] gap-6">
          <AppSidebar />

          <div style={{ transform: `translateY(${sceneLift(frame, start)}px)` }} className="flex min-w-0 flex-col gap-5">
            <header className="flex items-center justify-between rounded-[30px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-md">
              <div>
                <p style={{ fontFamily: "Satoshi, sans-serif" }} className="text-[11px] uppercase tracking-[0.3em] text-white/45">
                  Product demo
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <Img src={staticFile("images/typelogo-inside.webp")} style={{ width: 148, height: 28, objectFit: "contain" }} />
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/55">
                    {subtitle}
                  </span>
                </div>
              </div>
              <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/55">
                Founder view
              </div>
            </header>

            <div className="flex items-center gap-2.5 rounded-[26px] border border-white/10 bg-white/5 p-3 backdrop-blur-md">
              {['All', 'Techno', 'House', 'Electronic', 'Underground'].map((item, index) => (
                <span key={item} className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] ${chipClass(index === 0)}`}>
                  {item}
                </span>
              ))}
              <div className="ml-auto rounded-full border border-white/10 bg-black/30 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/55">
                Bucharest / tonight
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-rows-[1fr] gap-4">
              {EVENT_CARDS.map((card, index) => (
                <EventCard key={card.title} card={card} frame={local} offset={10 + index * 8} />
              ))}
            </div>
          </div>

          <aside style={{ transform: `translateY(${sceneLift(frame, start + 4)}px)` }} className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p style={{ fontFamily: "Satoshi, sans-serif" }} className="text-[11px] uppercase tracking-[0.26em] text-white/45">
                    Live map
                  </p>
                  <p className="mt-1 text-[18px] text-white/85">Tonight in the city</p>
                </div>
                <div className="rounded-full border border-noctvm-emerald/20 bg-noctvm-emerald/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-noctvm-emerald">
                  Live
                </div>
              </div>
              <div className="relative h-[210px] overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.22),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:22px_22px] opacity-35" />
                <div className="absolute left-[22%] top-[28%] h-3 w-3 rounded-full bg-noctvm-violet shadow-[0_0_18px_rgba(124,58,237,0.8)]" />
                <div className="absolute left-[58%] top-[42%] h-3 w-3 rounded-full bg-noctvm-emerald shadow-[0_0_18px_rgba(16,185,129,0.8)]" />
                <div className="absolute left-[72%] top-[22%] h-3 w-3 rounded-full bg-noctvm-gold shadow-[0_0_18px_rgba(212,168,67,0.8)]" />
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between">
                <p style={{ fontFamily: "Satoshi, sans-serif" }} className="text-[11px] uppercase tracking-[0.26em] text-white/45">
                  Trending
                </p>
                <span className="text-[11px] text-white/40">{EVENT_CARDS.length} highlights</span>
              </div>
              <div className="space-y-2">
                {EVENT_CARDS.map((card, index) => (
                  <div key={card.title} style={{ opacity: interpolate(local, [8 + index * 6, 8 + index * 6 + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }} className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-black/25 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.22em] text-white/60">
                      {card.source}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] text-white/88">{card.venue}</p>
                      <p className="truncate text-[11px] text-white/45">{card.time} · {card.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function VenuesScene({ frame, start }: { frame: number; start: number }) {
  const local = frame - start;
  return (
    <section style={{ opacity: sceneOpacity(frame, start, SCENE_DURATIONS[1]) }} className="absolute inset-0 overflow-hidden bg-[#050505] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.18),transparent_26%),radial-gradient(circle_at_78%_18%,rgba(124,58,237,0.14),transparent_24%)]" />
      <div className="relative h-full p-8">
        <div className="grid h-full grid-cols-[92px_minmax(0,1fr)_320px] gap-6">
          <AppSidebar />

          <div style={{ transform: `translateY(${sceneLift(frame, start)}px)` }} className="flex min-w-0 flex-col gap-4">
            <header className="flex items-center justify-between rounded-[30px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-md">
              <div>
                <p style={{ fontFamily: "Satoshi, sans-serif" }} className="text-[11px] uppercase tracking-[0.3em] text-white/45">
                  Venues
                </p>
                <p className="mt-2 text-[30px] text-[#F5F3F0]">Places with a real identity</p>
              </div>
              <Img src={staticFile("images/typelogo-first.webp")} style={{ width: 128, height: 34, objectFit: "contain" }} />
            </header>

            <div className="flex items-center gap-2 rounded-[24px] border border-white/10 bg-white/5 p-3 backdrop-blur-md">
              {['All', 'Followed', 'Popular', 'Events'].map((item, index) => (
                <span key={item} className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] ${chipClass(index === 0)}`}>
                  {item}
                </span>
              ))}
              <div className="ml-auto rounded-full border border-white/10 bg-black/30 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/55">
                Bucharest
              </div>
            </div>

            <div className="grid min-h-0 grid-cols-[1.05fr_0.95fr] gap-4">
              <div className="flex min-h-0 flex-col gap-3 overflow-hidden rounded-[30px] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["210", "Venues"],
                    ["78", "Followed"],
                    ["4.8", "Average"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-[22px] border border-white/10 bg-black/25 p-4">
                      <p className="text-[28px] text-[#F5F3F0]">{value}</p>
                      <p style={{ fontFamily: "Satoshi, sans-serif" }} className="mt-1 text-[10px] uppercase tracking-[0.24em] text-white/45">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex-1 space-y-3 overflow-hidden">
                  {VENUE_ROWS.map((venue, index) => (
                    <VenueRow key={venue.name} venue={venue} frame={local} offset={10 + index * 9} />
                  ))}
                </div>
              </div>

              <div className="flex min-h-0 flex-col gap-4">
                <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p style={{ fontFamily: "Satoshi, sans-serif" }} className="text-[11px] uppercase tracking-[0.26em] text-white/45">
                        Map layer
                      </p>
                      <p className="mt-1 text-[18px] text-white/85">City structure and hotspots</p>
                    </div>
                    <div className="rounded-full border border-noctvm-violet/20 bg-noctvm-violet/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-noctvm-violet">
                      Live map
                    </div>
                  </div>
                  <div className="relative h-[258px] overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.22),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
                    <div className="absolute left-[20%] top-[20%] h-16 w-16 rounded-full border border-noctvm-violet/30 bg-noctvm-violet/10" />
                    <div className="absolute left-[52%] top-[36%] h-20 w-20 rounded-full border border-noctvm-emerald/30 bg-noctvm-emerald/10" />
                    <div className="absolute left-[68%] top-[58%] h-14 w-14 rounded-full border border-noctvm-gold/30 bg-noctvm-gold/10" />
                    <div className="absolute left-[24%] top-[50%] h-3 w-3 rounded-full bg-noctvm-violet shadow-[0_0_18px_rgba(124,58,237,0.9)]" />
                    <div className="absolute left-[58%] top-[42%] h-3 w-3 rounded-full bg-noctvm-emerald shadow-[0_0_18px_rgba(16,185,129,0.9)]" />
                    <div className="absolute left-[73%] top-[68%] h-3 w-3 rounded-full bg-noctvm-gold shadow-[0_0_18px_rgba(212,168,67,0.9)]" />
                  </div>
                </div>

                <div className="rounded-[30px] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <div className="mb-3 flex items-center justify-between">
                    <p style={{ fontFamily: "Satoshi, sans-serif" }} className="text-[11px] uppercase tracking-[0.26em] text-white/45">
                      Trending now
                    </p>
                    <span className="text-[11px] text-white/40">More activity tonight</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {VENUE_ROWS.slice(0, 4).map((venue, index) => (
                      <div key={venue.name} style={{ opacity: interpolate(local, [12 + index * 8, 12 + index * 8 + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }} className="rounded-[20px] border border-white/10 bg-black/25 p-3">
                        <p className="text-[13px] text-white/88">{venue.name}</p>
                        <p className="mt-1 text-[11px] text-white/45">{venue.count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside style={{ transform: `translateY(${sceneLift(frame, start + 6)}px)` }} className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <p style={{ fontFamily: "Satoshi, sans-serif" }} className="text-[11px] uppercase tracking-[0.26em] text-white/45">
                Filters
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Techno', 'House', 'Minimal', 'Live', 'Queer'].map((item, index) => (
                  <span key={item} className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] ${chipClass(index < 2)}`}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between">
                <p style={{ fontFamily: "Satoshi, sans-serif" }} className="text-[11px] uppercase tracking-[0.26em] text-white/45">
                  Reviews
                </p>
                <span className="text-[11px] text-white/40">Last 24h</span>
              </div>
              <div className="space-y-2.5">
                {VENUE_ROWS.map((venue, index) => (
                  <div key={venue.name} className="rounded-[18px] border border-white/10 bg-black/25 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] text-white/85">{venue.name}</p>
                      <p className="text-[11px] text-noctvm-gold">{venue.score}</p>
                    </div>
                    <p className="mt-1 text-[11px] text-white/45">{index + 12} new notes</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function PocketScene({ frame, start }: { frame: number; start: number }) {
  const local = frame - start;

  return (
    <section style={{ opacity: sceneOpacity(frame, start, SCENE_DURATIONS[2]) }} className="absolute inset-0 overflow-hidden bg-[#050505] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(212,168,67,0.18),transparent_24%),radial-gradient(circle_at_78%_25%,rgba(124,58,237,0.16),transparent_26%),radial-gradient(circle_at_50%_82%,rgba(16,185,129,0.10),transparent_28%)]" />
      <div className="relative h-full p-8">
        <div className="mx-auto flex h-full max-w-[1520px] items-center justify-center">
          <div className="relative h-full w-full max-w-[1180px] rounded-[48px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <div className="flex h-full flex-col overflow-hidden rounded-[38px] border border-white/10 bg-[#060606]">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div className="flex items-center gap-4">
                  <Img src={staticFile("images/logo.svg")} style={{ width: 28, height: 32, objectFit: "contain" }} />
                  <div>
                    <p style={{ fontFamily: "Satoshi, sans-serif" }} className="text-[11px] uppercase tracking-[0.28em] text-white/45">
                      Pocket
                    </p>
                    <p className="text-[18px] text-white/85">Rewards and identity</p>
                  </div>
                </div>
                <div className="rounded-full border border-noctvm-gold/20 bg-noctvm-gold/10 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-noctvm-gold">
                  Moonrays active
                </div>
              </div>

              <div className="grid flex-1 grid-cols-[0.92fr_1.08fr] gap-4 p-6">
                <div style={{ transform: `translateY(${sceneLift(frame, start)}px)` }} className="flex flex-col gap-4 rounded-[34px] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                  <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_50%_40%,rgba(212,168,67,0.22),transparent_34%),radial-gradient(circle_at_50%_60%,rgba(124,58,237,0.22),transparent_46%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6">
                    <div className="mx-auto flex h-[330px] w-[330px] items-center justify-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),transparent_25%),radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.28),rgba(0,0,0,0.1)_65%)] shadow-[0_0_60px_rgba(124,58,237,0.18)]">
                      <div className="text-center">
                        <p style={{ fontFamily: "Satoshi, sans-serif" }} className="text-[11px] uppercase tracking-[0.28em] text-white/50">
                          Pocket balance
                        </p>
                        <p style={{ fontFamily: "Freshid, sans-serif" }} className="mt-4 text-[92px] leading-none tracking-[-0.04em] text-[#F5F3F0]">
                          18.2k
                        </p>
                        <p style={{ fontFamily: "Satoshi, sans-serif" }} className="mt-2 text-[12px] uppercase tracking-[0.24em] text-white/55">
                          Moonrays
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Invite Nexus", "Copy code", "NOCTVM-72"],
                      ["Boutique", "Open", "Avatar effects"],
                    ].map(([label, action, detail]) => (
                      <div key={label} className="rounded-[24px] border border-white/10 bg-black/25 p-4">
                        <p style={{ fontFamily: "Satoshi, sans-serif" }} className="text-[11px] uppercase tracking-[0.26em] text-white/45">
                          {label}
                        </p>
                        <p className="mt-3 text-[18px] text-white/85">{detail}</p>
                        <button className="mt-4 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-white/65">
                          {action}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ transform: `translateY(${sceneLift(frame, start + 5)}px)` }} className="grid min-h-0 grid-rows-[auto_auto_1fr] gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    {REWARDS.slice(0, 2).map((reward, index) => (
                      <RewardTile key={reward.title} reward={reward} frame={local} offset={10 + index * 9} />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {REWARDS.slice(2).map((reward, index) => (
                      <RewardTile key={reward.title} reward={reward} frame={local} offset={30 + index * 9} />
                    ))}
                  </div>

                  <div className="grid grid-cols-[1.15fr_0.85fr] gap-4">
                    <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                      <div className="mb-3 flex items-center justify-between">
                        <p style={{ fontFamily: "Satoshi, sans-serif" }} className="text-[11px] uppercase tracking-[0.26em] text-white/45">
                          Stories
                        </p>
                        <span className="text-[11px] text-white/40">Tap to view</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {[
                          "A",
                          "B",
                          "C",
                          "D",
                        ].map((label, index) => (
                          <div key={label} className="flex flex-col items-center gap-2">
                            <div className="relative h-14 w-14 rounded-full border-2 border-noctvm-violet bg-[linear-gradient(135deg,rgba(124,58,237,0.6),rgba(212,168,67,0.25))] p-0.5">
                              <div className="flex h-full w-full items-center justify-center rounded-full bg-black/50 text-[12px] uppercase tracking-[0.24em] text-white/80">
                                {label}
                              </div>
                            </div>
                            <div className="h-1.5 w-10 overflow-hidden rounded-full bg-white/8">
                              <div className="h-full rounded-full bg-white/55" style={{ width: `${60 + index * 8}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                      <p style={{ fontFamily: "Satoshi, sans-serif" }} className="text-[11px] uppercase tracking-[0.26em] text-white/45">
                        Activity
                      </p>
                      <div className="mt-4 space-y-2.5">
                        {[
                          ["Attend event", "+50"],
                          ["Post story", "+5"],
                          ["Leave review", "+25"],
                        ].map(([label, pts]) => (
                          <div key={label} className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/25 px-4 py-3">
                            <span className="text-[13px] text-white/85">{label}</span>
                            <span className="text-[11px] uppercase tracking-[0.24em] text-noctvm-gold">{pts}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[1.1fr_0.9fr] gap-4 border-t border-white/10 px-6 py-4">
                <div className="flex items-center justify-between rounded-[26px] border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
                  <span className="text-[11px] uppercase tracking-[0.26em] text-white/45">Pocket guide</span>
                  <span className="text-[13px] text-white/75">Collect, status, identity</span>
                </div>
                <div className="flex items-center justify-between rounded-[26px] border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
                  <span className="text-[11px] uppercase tracking-[0.26em] text-white/45">Boutique drop</span>
                  <span className="text-[13px] text-white/75">Violet Pulse Frame</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function NoctvmDemo({ title, subtitle }: NoctvmDemoProps) {
  useNoctvmFonts();

  const frame = useCurrentFrame();

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050505] text-white">
      <AppShellScene frame={frame} start={0} title={title} subtitle={subtitle} />
      <VenuesScene frame={frame} start={SCENE_DURATIONS[0]} />
      <PocketScene frame={frame} start={SCENE_DURATIONS[0] + SCENE_DURATIONS[1]} />
    </div>
  );
}
