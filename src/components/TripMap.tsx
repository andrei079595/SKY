import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CountryVisit } from '../types';
import { EUROPE_DATA } from '../constants';

// Fix for default marker icons in Leaflet with React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  countries: CountryVisit[];
  theme: 'light' | 'dark';
}

// Component to handle map bounds automatically
const ChangeView: React.FC<{ markers: { position: [number, number] }[] }> = ({ markers }) => {
  const map = useMap();
  
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => m.position));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
    }
    // Force a resize check to ensure map renders correctly
    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [markers, map]);
  
  return null;
};

export const TripMap: React.FC<MapProps> = ({ countries, theme }) => {
  const markers = useMemo(() => {
    return countries
      .map(c => ({
        id: c.id,
        position: [
          EUROPE_DATA[c.name]?.cities[c.city]?.[1], 
          EUROPE_DATA[c.name]?.cities[c.city]?.[0]
        ] as [number, number],
        label: `${c.city}, ${c.name}`
      }))
      .filter(m => m.position[0] !== undefined && m.position[1] !== undefined);
  }, [countries]);

  const path = useMemo(() => {
    return markers.map(m => m.position);
  }, [markers]);

  const isDark = theme === 'dark';

  return (
    <div className="w-full h-full relative">
      <MapContainer 
        center={[48.8566, 2.3522]} 
        zoom={4} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ChangeView markers={markers} />

        {markers.map(marker => (
          <Marker key={marker.id} position={marker.position}>
            <Popup>
              <div className="font-bold text-blue-900">{marker.label}</div>
            </Popup>
          </Marker>
        ))}

        {path.length > 1 && (
          <Polyline 
            positions={path} 
            color={isDark ? '#3b82f6' : '#1e40af'} 
            weight={4}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
      
      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100/50 dark:bg-stone-900/50 z-10 pointer-events-none">
          <div className="text-stone-500 dark:text-stone-400 font-serif italic bg-white dark:bg-stone-800 px-6 py-3 rounded-2xl shadow-xl">
            Añade países para trazar tu ruta
          </div>
        </div>
      )}
    </div>
  );
};
