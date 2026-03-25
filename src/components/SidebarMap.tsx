'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Venue, NoctEvent } from '@/lib/types';

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
          const tonightEvent = isEventsMode ? events.find(e => e.venue === venue.name) : null;
          const count = eventCounts[venue.name] || 0;
          
          return venue.lat && venue.lng ? (
            <Marker 
              key={venue.id || venue.name} 
              position={[venue.lat, venue.lng]} 
              icon={customIcon}
            >
              <Popup className="noctvm-popup">
                <div 
                  onClick={() => {
                    if (isEventsMode && tonightEvent && onEventClick) {
                      onEventClick(tonightEvent);
                    } else {
                      onVenueClick?.(venue.name);
                    }
                  }}
                  className="bg-noctvm-black/98 text-white p-1.5 rounded-xl border border-white/10 min-w-0 w-[115px] cursor-pointer hover:border-noctvm-violet/30 hover:bg-noctvm-midnight transition-all group/pop relative flex flex-col gap-0.5"
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-noctvm-caption font-bold text-white truncate leading-tight flex-1">{venue.name}</p>
                    <div className="w-4 h-4 rounded-md bg-noctvm-violet/10 flex items-center justify-center text-noctvm-violet group-hover/pop:bg-noctvm-violet group-hover/pop:text-white transition-all flex-shrink-0">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                  
                  <p className="text-noctvm-xs text-noctvm-silver/40 truncate leading-none mb-0.5">{venue.address}</p>
                  
                  {isEventsMode && tonightEvent ? (
                    <div className="p-1 rounded-lg bg-noctvm-violet/5 border border-noctvm-violet/15">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="w-1 h-1 rounded-full bg-noctvm-violet animate-pulse" />
                        <p className="text-[7px] text-noctvm-violet font-mono uppercase tracking-tight">Tonight</p>
                      </div>
                      <p className="text-noctvm-micro font-semibold text-white/90 truncate leading-tight">{tonightEvent.title}</p>
                    </div>
                  ) : (
                    <>
                      {count > 0 ? (
                        <p className="text-noctvm-xs text-noctvm-emerald font-mono leading-none">{count} events</p>
                      ) : (
                        <div className="flex gap-1 overflow-hidden">
                          {venue.genres?.slice(0, 1).map((g, i) => (
                            <span key={i} className="text-[7px] px-1 py-0 rounded bg-noctvm-violet/10 text-noctvm-violet/70 border border-noctvm-violet/15">
                              {g}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          ) : null;
        })}
      </MapContainer>
    </div>
  );
}
