export type Source =
  | 'fever'
  | 'zilesinopti'
  | 'iabilet'
  | 'onevent'
  | 'ambilet'
  | 'livetickets'
  | 'ra'
  | 'eventbook'
  | 'controlclub'
  | 'clubguesthouse'
  | 'emagic';

export interface ScrapedEvent {
  title:       string;
  venue:       string;
  date:        string;         // YYYY-MM-DD
  time:        string | null;
  description: string | null;
  image_url:   string;
  event_url:   string;
  genres:      string[];
  price:       string | null;
  ticket_url?:  string | null;
  city?:        string;
}
