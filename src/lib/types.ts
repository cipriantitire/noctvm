export interface Venue {
  id: string;
  name: string;
  address: string | null;
  genres: string[];
  capacity: number | null;
  rating: number | null;
  review_count: number | null;
  description: string | null;
  followers: number;
  city: string;
  lat: number | null;
  lng: number | null;
  owner_id?: string;
  badge: 'none' | 'owner' | 'admin' | 'gold' | 'verified';
  logo_url?: string | null;
  is_verified: boolean;
  featured: boolean;
  view_count: number;
  save_count: number;
  website?: string | null;
  instagram?: string;
  facebook?: string;
  google_place_id?: string;
  google_reviews?: Array<{ author_name: string; rating: number; text: string; time: number; profile_photo_url: string }>;
  photos?: string[];
}

export interface NoctEvent {
  id: string;
  source: 'fever' | 'ra' | 'zilesinopti' | 'livetickets' | 'iabilet' | 'beethere' | 'onevent' | 'ambilet' | 'eventbook' | 'manual' | 'controlclub' | 'clubguesthouse';
  title: string;
  venue: string;
  date: string;
  time: string | null;
  description: string | null;
  image_url: string;
  event_url: string;
  genres: string[];
  price: string | null;
  ticket_url?: string | null;
  city?: string;
  rating?: string;
  reviews?: number;
  lat?: number;
  lng?: number;
  featured?: boolean;
  is_promoted?: boolean;
  view_count?: number;
  save_count?: number;
  ticket_provider?: 'livetickets' | 'iabilet' | 'eventbook' | 'ambilet' | 'fever' | 'ra' | 'none';
}
