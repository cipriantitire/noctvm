export interface NoctEvent {
  source: 'fever' | 'ra' | 'zilesinopti' | 'livetickets' | 'iabilet';
  title: string;
  venue: string;
  date: string;
  time: string | null;
  description: string | null;
  image_url: string;
  event_url: string;
  genres: string[];
  price: string | null;
  rating?: string;
  reviews?: number;
}
