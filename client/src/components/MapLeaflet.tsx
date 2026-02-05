import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { cn } from "@/lib/utils";

// Fix for default marker icons in Leaflet with Vite
// We need to manually point to the marker images
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons
const createPriceIcon = (price: number, isHovered: boolean) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="bg-white rounded-full px-3 py-1.5 shadow-lg border-2 ${isHovered ? 'border-primary scale-110' : 'border-primary'} font-semibold text-sm transition-transform" style="width: max-content;">
        €${price}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

const userIcon = L.divIcon({
  className: 'user-location-icon',
  html: `
    <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 100%; height: 100%; background-color: rgba(59, 130, 246, 0.4); border-radius: 50%; animation: pulse 2s infinite;"></div>
      <div style="position: relative; width: 14px; height: 14px; background-color: rgb(37, 99, 235); border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Component to handle map view updates
function MapController({ center, zoom }: { center: { lat: number; lng: number } | null, zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], zoom, {
        duration: 1.5
      });
    }
  }, [center, zoom, map]);

  return null;
}

interface Property {
  id: number;
  title: string;
  latitude: string | null;
  longitude: string | null;
  pricePerNight: number;
  images?: any[];
}

interface MapLeafletProps {
  className?: string;
  properties: Property[];
  userLocation: { lat: number; lng: number } | null;
  center: { lat: number; lng: number };
  zoom: number;
  hoveredPropertyId: number | null;
  onMarkerClick: (id: number) => void;
  onMarkerHover: (id: number | null) => void;
}

export function MapLeaflet({ 
  className, 
  properties, 
  userLocation, 
  center, 
  zoom, 
  hoveredPropertyId,
  onMarkerClick,
  onMarkerHover
}: MapLeafletProps) {
  return (
    <div className={cn("w-full h-full relative z-0", className)}>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.4; }
            50% { transform: scale(1.5); opacity: 0; }
            100% { transform: scale(1); opacity: 0.4; }
          }
          .leaflet-div-icon {
            background: transparent;
            border: none;
          }
        `}
      </style>
      <MapContainer 
        center={[center.lat, center.lng]} 
        zoom={zoom} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={center} zoom={zoom} />

        {/* Property Markers */}
        {properties.map((property) => {
          if (!property.latitude || !property.longitude) return null;
          const lat = parseFloat(property.latitude);
          const lng = parseFloat(property.longitude);
          
          return (
            <Marker
              key={property.id}
              position={[lat, lng]}
              icon={createPriceIcon(property.pricePerNight, hoveredPropertyId === property.id)}
              eventHandlers={{
                click: () => onMarkerClick(property.id),
                mouseover: () => onMarkerHover(property.id),
                mouseout: () => onMarkerHover(null)
              }}
              zIndexOffset={hoveredPropertyId === property.id ? 1000 : 0}
            />
          );
        })}

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
            zIndexOffset={2000}
          />
        )}
      </MapContainer>
    </div>
  );
}
