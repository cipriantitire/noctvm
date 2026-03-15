export interface Venue {
  id: string;
  name: string;
  address: string;
  genres: string[];
  capacity: number;
  rating: number;
  review_count: number;
  description: string;
  followers: number;
  city: 'Bucharest' | 'Constanta';
  lat: number | null;
  lng: number | null;
}

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
  lat?: number;
  lng?: number;
}
