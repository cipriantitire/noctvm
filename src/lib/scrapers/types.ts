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
}
