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

export default function VenueMap({ 
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
        <span className="text-[10px] uppercase tracking-widest font-mono">Initializing Map</span>
      </div>
    );
  }

  const center = CITY_CENTERS[activeCity] || CITY_CENTERS.bucuresti;
  const isEventsMode = activeTab === 'events' || activeTab === 'feed';
  
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
        <div className="absolute inset-0 z-[400] pointer-events-none overflow-hidden">
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
                  className="bg-noctvm-black/95 text-white p-2 rounded-xl border border-white/10 min-w-0 w-[120px] cursor-pointer hover:border-noctvm-violet/30 hover:bg-noctvm-midnight transition-all group/pop relative flex flex-col"
                >
                  <p className="text-[11px] font-bold text-white truncate mb-0">{venue.name}</p>
                  <p className="text-[9px] text-noctvm-silver/40 truncate mb-1.5">{venue.address}</p>
                  
                  {isEventsMode && tonightEvent ? (
                    <>
                      <div className="mb-1.5 p-1.5 rounded-lg bg-noctvm-violet/5 border border-noctvm-violet/10">
                        <p className="text-[8px] text-noctvm-violet font-mono uppercase tracking-wider mb-0.5">Tonight</p>
                        <p className="text-[10px] font-semibold text-white truncate leading-tight">{tonightEvent.title}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      {count > 0 && (
                        <p className="text-[9px] text-noctvm-emerald font-mono mb-1">{count} upcoming</p>
                      )}
                      <div className="flex gap-1 overflow-hidden mb-1.5">
                        {venue.genres?.slice(0, 1).map((g, i) => (
                          <span key={i} className="text-[8px] px-1.5 py-0 rounded-full bg-noctvm-violet/10 text-noctvm-violet/70 border border-noctvm-violet/15">
                            {g}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-end">
                    <div className="w-5 h-5 rounded-md bg-noctvm-violet/10 flex items-center justify-center text-noctvm-violet group-hover/pop:bg-noctvm-violet group-hover/pop:text-white transition-all">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null;
        })}
      </MapContainer>
    </div>
  );
}
