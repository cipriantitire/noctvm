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
  country?: string;
  image_url?: string;
  lat: number | null;
  lng: number | null;
  owner_id?: string;
  badge: 'none' | 'blue' | 'gold';
  is_verified: boolean;
  featured: boolean;
  view_count: number;
  save_count: number;
}

export interface NoctEvent {
  id: string;
  source: 'fever' | 'ra' | 'zilesinopti' | 'livetickets' | 'iabilet' | 'beethere' | 'onevent' | 'ambilet' | 'manual';
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
  featured?: boolean;
  is_promoted?: boolean;
  view_count?: number;
  save_count?: number;
}
