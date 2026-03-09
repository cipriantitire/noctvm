export interface NoctEvent {
  source: 'beethere' | 'fever' | 'ra';
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
