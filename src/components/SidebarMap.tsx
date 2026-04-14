'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Venue, NoctEvent } from '@/lib/types';
import MapVenuePopup from '@/components/MapVenuePopup';

// Coordinates for center positioning
const CITY_CENTERS = {
  bucuresti: [44.4396, 26.0963] as [number, number],
  constanta: [44.1733, 28.6383] as [number, number],
};

interface MapProps {
  venues: Venue[];
  events?: NoctEvent[];
  eventCounts?: Record<string, number>;
  activeCity: 'bucuresti' | 'constanta';
  activeTab: 'events' | 'feed' | 'venues' | 'explore' | 'profile' | 'messages' | 'notifications';
  onVenueClick?: (venueName: string) => void;
  onEventClick?: (event: NoctEvent) => void;
  headerHidden?: boolean;
}

// Dynamic imports for the map components
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const MapViewUpdater = ({ center, useMap }: { center: [number, number], useMap: any }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.setView(center, 12, { animate: true });
    }
  }, [map, center]);
  return null;
};

const MapController = ({ center }: { center: [number, number] }) => {
  const [useMapHook, setUseMapHook] = useState<any>(null);

  useEffect(() => {
    import('react-leaflet').then((mod) => {
      setUseMapHook(() => mod.useMap);
    });
  }, []);

  return useMapHook ? <MapViewUpdater center={center} useMap={useMapHook} /> : null;
};

export default function SidebarMap({ 
  venues, 
  events = [],
  eventCounts = {},
  activeCity, 
  activeTab, 
  onVenueClick, 
  onEventClick,
  headerHidden = false 
}: MapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    import('leaflet').then((leaflet) => {
      setL(leaflet.default || leaflet);
    });
  }, []);

  if (!isMounted || !L) {
    return (
      <div className="w-full h-full bg-noctvm-midnight flex flex-col items-center justify-center text-noctvm-silver gap-2">
        <div className="w-4 h-4 border-2 border-noctvm-violet border-t-transparent rounded-full animate-spin" />
        <span className="text-noctvm-caption uppercase tracking-widest font-mono">Initializing Map</span>
      </div>
    );
  }

  const center = CITY_CENTERS[activeCity] || CITY_CENTERS.bucuresti;
  const isEventsMode = activeTab === 'events' || activeTab === 'feed' || activeTab === 'profile';
  
  const customIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #a78bfa; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #a78bfa;"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

  return (
    <div className={`w-full h-full relative group overflow-hidden transition-transform duration-300 ease-in-out ${headerHidden ? '-translate-y-[calc(100%+1rem)]' : ''}`}>
      <MapContainer 
        center={center} 
        zoom={12} 
        style={{ height: '100%', width: '100%', background: '#0a0a0f' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Radar Effect Overlays Moved Inside with lower Z-index */}
        <div className="absolute inset-0 relative z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] radar-sweep opacity-20" />
          <div className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full border border-noctvm-violet/20 radar-pulse" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full border border-noctvm-violet/10 radar-pulse stagger-2" />
        </div>

        <MapController center={center} />

        {venues.map((venue) => {
          const venueEvents = isEventsMode ? events.filter((event) => event.venue === venue.name) : [];
          const count = eventCounts[venue.name] || venueEvents.length;
          
          return venue.lat && venue.lng ? (
            <Marker 
              key={venue.id || venue.name} 
              position={[venue.lat, venue.lng]} 
              icon={customIcon}
            >
              <Popup className="noctvm-popup" closeButton={false} maxWidth={280}>
                <MapVenuePopup
                  venue={venue}
                  isEventsMode={isEventsMode}
                  events={venueEvents}
                  eventCount={count}
                  onVenueClick={onVenueClick}
                  onEventClick={onEventClick}
                />
              </Popup>
            </Marker>
          ) : null;
        })}
      </MapContainer>
    </div>
  );
}
