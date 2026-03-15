'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Venue } from '@/lib/types';

// Coordinates for center positioning
const CITY_CENTERS = {
  bucuresti: [44.4396, 26.0963] as [number, number],
  constanta: [44.1733, 28.6383] as [number, number],
};

interface MapProps {
  venues: Venue[];
  activeCity: 'bucuresti' | 'constanta';
  activeTab: 'feed' | 'venues' | 'explore' | 'profile' | 'messages' | 'notifications';
  onVenueClick?: (venueName: string) => void;
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
      map.setView(center, 13, { animate: true });
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

export default function VenueMap({ venues, activeCity, activeTab, onVenueClick }: MapProps) {
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
  
  // Custom Icon using Leaflet's L
  const customIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #a78bfa; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #a78bfa;"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

  return (
    <div className="w-full h-full relative group">
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%', background: '#0a0a0f' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapController center={center} />

        {venues.map((venue) => (
          venue.lat && venue.lng ? (
            <Marker 
              key={venue.id || venue.name} 
              position={[venue.lat, venue.lng]} 
              icon={customIcon}
              eventHandlers={{
                click: () => onVenueClick?.(venue.name),
              }}
            >
              <Popup className="noctvm-popup">
                <div className="bg-noctvm-black text-white p-2 rounded-lg border border-white/10 min-w-[120px]">
                  <p className="text-[11px] font-bold text-noctvm-violet truncate">{venue.name}</p>
                  <p className="text-[9px] text-noctvm-silver truncate mt-0.5">{venue.address}</p>
                  <div className="flex gap-1 mt-1.5 overflow-hidden">
                    {venue.genres?.slice(0, 2).map((g, i) => (
                      <span key={i} className="text-[8px] px-1.5 py-0.5 rounded-full bg-noctvm-violet/10 text-noctvm-violet border border-noctvm-violet/20">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
      
      {/* City/Tab Overlay */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1 pointer-events-none">
        <div className="px-2 py-1 bg-noctvm-black/80 backdrop-blur-md rounded border border-white/10 w-fit">
          <span className="text-[9px] font-mono text-noctvm-violet uppercase tracking-wider">{activeCity}</span>
        </div>
        <div className="px-2 py-1 bg-noctvm-black/60 backdrop-blur-md rounded border border-white/5 w-fit">
          <span className="text-[8px] font-mono text-noctvm-silver uppercase tracking-wider">
            {activeTab === 'venues' ? 'Showing All Venues' : 'Venues with Events'}
          </span>
        </div>
      </div>
    </div>
  );
}
