import { NoctEvent } from '@/lib/types';
import { CalendarIcon, TicketIcon, StarIcon } from './icons';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

function getSourceBadge(source: string) {
  switch (source) {
    case 'fever': return { label: 'Fever', color: 'bg-orange-500/20 text-orange-400' };
    case 'ra': return { label: 'RA', color: 'bg-blue-500/20 text-blue-400' };
    case 'livetickets': return { label: 'LiveTickets', color: 'bg-pink-500/20 text-pink-400' };
    case 'iabilet': return { label: 'iaBilet', color: 'bg-cyan-500/20 text-cyan-400' };
    case 'beethere': return { label: 'BeeThere', color: 'bg-yellow-500/20 text-yellow-400' };
    case 'zilesinopti': return { label: 'Zile si Nopti', color: 'bg-amber-500/20 text-amber-400' };
    default: return { label: source, color: 'bg-noctvm-silver/20 text-noctvm-silver' };
  }
}

interface EventCardProps {
  event: NoctEvent;
  variant?: 'portrait' | 'landscape';
}

export default function EventCard({ event, variant = 'portrait' }: EventCardProps) {
  const sourceBadge = getSourceBadge(event.source);
  
  // Robust price parsing for tags like "50 - 100 RON" or "de la 0 RON" or "Free"
  const getPriceBadge = () => {
    if (!event.price || event.price.toLowerCase() === 'free') {
      if (event.price?.toLowerCase() === 'free') {
        return (
          <div className="absolute bottom-2.5 right-2.5 bg-noctvm-emerald/90 backdrop-blur-md rounded-xl p-2 flex items-center justify-center min-w-[48px] border border-white/20 shadow-xl z-20">
            <span className="text-[12px] font-bold text-white uppercase tracking-tighter">FREE</span>
          </div>
        );
      }
      return null;
    }
    
    // Extract first number and currency (last word)
    const matches = event.price.match(/(\d+)/);
    const value = matches ? matches[0] : '';
    const currency = event.price.trim().split(' ').pop() || 'RON';
    
    return (
      <div className="absolute bottom-2.5 right-2.5 bg-noctvm-emerald/90 backdrop-blur-md rounded-xl p-2 flex flex-col items-center justify-center min-w-[48px] h-[48px] border border-white/20 shadow-xl z-20">
        <span className="text-[16px] font-bold text-white leading-none">{value}</span>
        <span className="text-[9px] font-bold text-white/80 uppercase tracking-tighter leading-none mt-1">{currency}</span>
      </div>
    );
  };

  const ratingBadge = event.rating && (
    <div className={`absolute ${event.price ? 'top-2.5 right-2.5' : 'bottom-2.5 right-2.5'} flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/5 z-20`}>
      <StarIcon className="w-3 h-3 text-noctvm-gold" />
      <span className="text-xs font-bold text-noctvm-gold">{event.rating}</span>
    </div>
  );

  if (variant === 'landscape') {
    return (
      <a
        href={event.event_url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex bg-noctvm-surface rounded-xl overflow-hidden border border-noctvm-border hover:border-noctvm-violet/50 transition-all duration-300 hover:shadow-glow h-[160px] lg:h-[180px]"
      >
        <div className="relative w-[180px] sm:w-[240px] flex-shrink-0 overflow-hidden bg-noctvm-midnight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className={`absolute top-2.5 left-2.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight ${sourceBadge.color} backdrop-blur-md border border-white/10 z-20`}>
            {sourceBadge.label}
          </div>
          
          {getPriceBadge()}
          {ratingBadge}
        </div>
        
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {event.genres.slice(0, 2).map((genre) => (
                <span key={genre} className="px-2 py-0.5 rounded-lg text-[10px] uppercase font-bold bg-white/5 text-noctvm-silver/60 border border-white/5">
                  {genre}
                </span>
              ))}
            </div>
            <h3 className="font-heading font-semibold text-white text-sm lg:text-base leading-tight mb-1 line-clamp-2 group-hover:text-noctvm-violet transition-colors">
              {event.title}
            </h3>
            <p className="text-noctvm-silver/70 text-xs truncate">{event.venue}</p>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 text-noctvm-silver/80">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono">{formatDate(event.date)}</span>
              {event.time && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span className="text-[11px] font-mono text-noctvm-violet">{event.time}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={event.event_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-noctvm-surface rounded-xl overflow-hidden border border-noctvm-border hover:border-noctvm-violet/50 transition-all duration-300 hover:shadow-glow h-[320px] lg:h-[380px]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-noctvm-midnight flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight ${sourceBadge.color} backdrop-blur-md border border-white/10 z-20`}>
          {sourceBadge.label}
        </div>

        {getPriceBadge()}
        {ratingBadge}
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {event.genres.slice(0, 3).map((genre) => (
            <span key={genre} className="px-2 py-0.5 rounded-lg text-[10px] lg:text-[11px] uppercase font-bold bg-white/5 text-noctvm-silver/60 border border-white/5">
              {genre}
            </span>
          ))}
        </div>
        <h3 className="font-heading font-semibold text-white text-sm lg:text-lg leading-tight mb-2 line-clamp-2 group-hover:text-noctvm-violet transition-colors">
          {event.title}
        </h3>
        <p className="text-noctvm-silver/70 text-sm truncate mb-4">{event.venue}</p>
        
        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-noctvm-silver/80">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono leading-none">{formatDate(event.date)}</span>
            {event.time && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <span className="text-[11px] font-mono text-noctvm-violet leading-none">{event.time}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}