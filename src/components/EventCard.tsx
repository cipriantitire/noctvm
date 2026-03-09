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

  if (variant === 'landscape') {
    return (
      <a
        href={event.event_url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex bg-noctvm-surface rounded-xl overflow-hidden border border-noctvm-border hover:border-noctvm-violet/50 transition-all duration-300 hover:shadow-glow h-[180px]"
      >
        {/* Image - left side */}
        <div className="relative w-[240px] flex-shrink-0 overflow-hidden bg-noctvm-midnight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-medium ${sourceBadge.color} backdrop-blur-sm`}>
            {sourceBadge.label}
          </div>
          {event.rating && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5">
              <StarIcon className="w-3 h-3 text-noctvm-gold" />
              <span className="text-xs font-mono text-noctvm-gold">{event.rating}</span>
            </div>
          )}
        </div>
        {/* Content - right side */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {event.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium bg-noctvm-midnight text-noctvm-silver border border-noctvm-border"
                >
                  {genre}
                </span>
              ))}
            </div>
            <h3 className="font-heading font-semibold text-white text-sm leading-tight mb-1.5 line-clamp-2 group-hover:text-noctvm-violet transition-colors">
              {event.title}
            </h3>
            <p className="text-noctvm-silver text-xs">{event.venue}</p>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-noctvm-border">
            <div className="flex items-center gap-1.5 text-noctvm-silver">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span className="text-xs font-mono">{formatDate(event.date)}</span>
              {event.time && <span className="text-xs font-mono text-noctvm-violet">{event.time}</span>}
            </div>
            {event.price && (
              <div className="flex items-center gap-1 text-noctvm-emerald">
                <TicketIcon className="w-3 h-3" />
                <span className="text-[11px] font-medium">{event.price.replace('de la ', '')}</span>
              </div>
            )}
          </div>
        </div>
      </a>
    );
  }

  // Portrait (default) - vertical card
  return (
    <a
      href={event.event_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-noctvm-surface rounded-xl overflow-hidden border border-noctvm-border hover:border-noctvm-violet/50 transition-all duration-300 hover:shadow-glow"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-noctvm-midnight">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-medium ${sourceBadge.color} backdrop-blur-sm`}>
          {sourceBadge.label}
        </div>
        {event.rating && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5">
            <StarIcon className="w-3 h-3 text-noctvm-gold" />
            <span className="text-xs font-mono text-noctvm-gold">{event.rating}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {event.genres.slice(0, 3).map((genre) => (
            <span
              key={genre}
              className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium bg-noctvm-midnight text-noctvm-silver border border-noctvm-border"
            >
              {genre}
            </span>
          ))}
        </div>
        <h3 className="font-heading font-semibold text-white text-sm leading-tight mb-1.5 line-clamp-2 group-hover:text-noctvm-violet transition-colors">
          {event.title}
        </h3>
        <p className="text-noctvm-silver text-xs mb-3">{event.venue}</p>
        <div className="flex items-center justify-between pt-3 border-t border-noctvm-border">
          <div className="flex items-center gap-1.5 text-noctvm-silver">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span className="text-xs font-mono">{formatDate(event.date)}</span>
            {event.time && <span className="text-xs font-mono text-noctvm-violet">{event.time}</span>}
          </div>
          {event.price && (
            <div className="flex items-center gap-1 text-noctvm-emerald">
              <TicketIcon className="w-3 h-3" />
              <span className="text-[11px] font-medium">{event.price.replace('de la ', '')}</span>
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
