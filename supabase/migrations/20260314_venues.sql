-- Create venues table
create table if not exists venues (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  address       text not null,
  genres        text[] not null default '{}',
  capacity      int not null default 0,
  rating        numeric(3,1) not null default 0,
  review_count  int not null default 0,
  description   text not null default '',
  followers     int not null default 0,
  city          text not null check (city in ('Bucharest', 'Constanța')),
  lat           numeric(10,7),
  lng           numeric(10,7),
  created_at    timestamptz default now()
);

alter table venues enable row level security;
create policy "venues_read" on venues for select using (true);

-- Seed Bucharest venues
insert into venues (name, address, genres, capacity, rating, review_count, description, followers, city) values
  ('Control Club', 'Str. Constantin Mille 4, Sector 1', array['Techno','House','Electronic'], 400, 4.7, 342, 'Underground electronic music club. Known for quality bookings and intimate atmosphere.', 2841, 'Bucharest'),
  ('Expirat Halele Carol', 'Halele Carol, Piața Libertății, Sector 4', array['Techno','Underground','Experimental'], 600, 4.8, 567, 'Legendary underground venue in Halele Carol complex. Raw industrial aesthetic and uncompromising sound.', 4120, 'Bucharest'),
  ('Nook Club', 'Bd. Nicolae Bălcescu 2, Sector 1', array['House','Disco','Electronic'], 300, 4.5, 218, 'Boutique club experience with curated lineups and a premium sound system.', 1654, 'Bucharest'),
  ('Club Guesthouse', 'Str. Batistei 14, Sector 2', array['Electronic','Live','Alternative'], 500, 4.4, 189, 'Multi-room venue hosting diverse events from electronic to live music.', 1982, 'Bucharest'),
  ('OXYA Club', 'Piața Victoriei, Sector 1', array['Electronic','Techno','House'], 800, 4.3, 423, 'Premium nightlife destination with world-class sound and production.', 3340, 'Bucharest'),
  ('Fratelli', 'Str. Gabroveni 16, Sector 3', array['House','Commercial','R&B'], 600, 4.1, 312, 'Trendy club in the old town with multiple floors and a rooftop terrace.', 2210, 'Bucharest'),
  ('Quantic Club', 'Bd. Magheru 12, Sector 1', array['Indie','Jazz','Electronic'], 350, 4.6, 276, 'The go-to spot for alternative music lovers. Eclectic programming, great cocktails.', 1780, 'Bucharest'),
  ('Club Eclipse', 'Str. Ion Câmpineanu 22, Sector 1', array['EDM','Commercial','Latin'], 700, 3.9, 445, 'Massive venue with state-of-the-art lighting rigs and impressive production value.', 2990, 'Bucharest'),
  ('Baraka', 'Str. Gabroveni 26, Sector 3', array['Minimal','Techno','Deep House'], 250, 4.5, 189, 'Intimate venue with a focus on minimal and deep electronic sounds.', 1220, 'Bucharest'),
  ('Midi Club', 'Str. Foișorului 23, Sector 3', array['Drum & Bass','Electronic','Experimental'], 300, 4.4, 134, 'Dedicated to experimental and underground sounds. A haven for music purists.', 890, 'Bucharest'),
  ('Void Club', 'Str. Vasile Lascăr 72, Sector 2', array['Techno','Industrial','Dark'], 350, 4.2, 167, 'Dark, raw, and unapologetically underground. For those who truly live the night.', 1100, 'Bucharest'),
  ('Fabrica', 'Str. Fabricii 4, Sector 6', array['Alternative','Rock','Electronic'], 1000, 4.3, 892, 'Creative hub turned nightlife destination. A converted factory with soul.', 5670, 'Bucharest')
on conflict (name) do nothing;

-- Seed Constanța venues
insert into venues (name, address, genres, capacity, rating, review_count, description, followers, city) values
  ('Vox Maris Beach Club', 'Sat Costinești, Constanța', array['House','Electronic','Commercial'], 2000, 4.5, 312, 'Iconic Black Sea beach club. Massive outdoor dancefloor with sea views and world-class DJs every summer.', 5200, 'Constanța'),
  ('Nuba Club', 'Bd. Mamaia, Constanța', array['House','Techno','Electronic'], 800, 4.3, 189, 'Premium nightclub on the Mamaia strip. Multiple rooms and a rooftop with Black Sea panoramas.', 2800, 'Constanța'),
  ('Doors Club', 'Str. Mircea cel Bătrân, Constanța', array['Techno','Underground','Minimal'], 350, 4.4, 134, 'Underground club bringing the best of Romanian techno to the coast.', 1400, 'Constanța'),
  ('Euphoria Music Hall', 'Bd. Aurel Vlaicu, Constanța', array['EDM','Commercial','Party'], 1200, 4.0, 267, 'Largest indoor venue in Constanța. Concert-grade production for big events and festivals.', 3100, 'Constanța'),
  ('Eden Club', 'Mamaia Nord, Constanța', array['House','Disco','R&B'], 600, 4.2, 98, 'Beachfront open-air club at Mamaia Nord. Sunset sessions and deep house vibes.', 1750, 'Constanța')
on conflict (name) do nothing;

create index if not exists venues_city_idx on venues(city);
create index if not exists venues_name_idx on venues(name);
