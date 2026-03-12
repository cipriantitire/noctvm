export interface NoctEvent {
  id: string;
  source: 'fever' | 'ra' | 'zilesinopti' | 'livetickets' | 'iabilet' | 'beethere';
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
