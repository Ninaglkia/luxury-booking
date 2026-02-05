import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

const libraries: ("places" | "geometry" | "marker")[] = ["places", "geometry", "marker"];

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
  showUserLocation?: boolean;
  onLocationFound?: (lat: number, lng: number) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
  showUserLocation = true,
  onLocationFound,
}: MapViewProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userPos, setUserPos] = useState<google.maps.LatLngLiteral | null>(null);
  
  // Use a ref to track if we've already centered on user to avoid re-centering on every render
  const hasCenteredOnUser = useRef(false);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    if (onMapReady) {
      onMapReady(mapInstance);
    }
  }, [onMapReady]);

  useEffect(() => {
    if (showUserLocation && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserPos(pos);
          if (onLocationFound) {
            onLocationFound(pos.lat, pos.lng);
          }
          
          // Center map on user location only once when first found, or if map just loaded
          if (map && !hasCenteredOnUser.current) {
            map.setCenter(pos);
            hasCenteredOnUser.current = true;
          }
        },
        (error) => {
          console.warn("Geolocation permission denied or error:", error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
      );
      
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [map, showUserLocation, onLocationFound]);

  if (loadError) {
    return <div className="p-4 text-red-500">Error loading Google Maps</div>;
  }

  if (!isLoaded) {
    return (
      <div className={cn("w-full h-[500px] flex items-center justify-center bg-gray-100", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-[500px]", className)}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={userPos || initialCenter}
        zoom={initialZoom}
        onLoad={onLoad}
        options={{
          mapId: "DEMO_MAP_ID", // Required for AdvancedMarkerElement
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: true,
          zoomControl: true,
        }}
      >
        {userPos && showUserLocation && (
          <MarkerF
            position={userPos}
            title="Tu sei qui"
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 2,
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}
