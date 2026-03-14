export interface NoctEvent {
  id: string;
  source: 'fever' | 'ra' | 'zilesinopti' | 'livetickets' | 'iabilet' | 'beethere' | 'onevent' | 'ambilet';
  title: string;
  venue: string;
  date: string;
  time: string | null;
  description: string | null;
  image_url: string;
  event_url: string;
  genres: string[];
  price: string | null;
  city?: string;
  rating?: string;
  reviews?: number;
}
