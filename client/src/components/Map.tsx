import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { getGoogleMapsClientConfig } from "@/lib/googleMapsConfig";

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const DefaultLeafletIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultLeafletIcon;

const userLeafletIcon = L.divIcon({
  className: "user-location-icon",
  html: `
    <div style="position: relative; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 100%; height: 100%; background-color: rgba(59, 130, 246, 0.35); border-radius: 9999px;"></div>
      <div style="position: relative; width: 10px; height: 10px; background-color: rgb(37, 99, 235); border-radius: 9999px; border: 2px solid white;"></div>
    </div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

type LatLng = { lat: number; lng: number };

function LeafletCenterController({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng], zoom);
  }, [center, zoom, map]);

  return null;
}

function LeafletFallbackMap({
  className,
  center,
  zoom,
  userPos,
  showUserLocation,
  reason,
}: {
  className?: string;
  center: LatLng;
  zoom: number;
  userPos: LatLng | null;
  showUserLocation: boolean;
  reason: string;
}) {
  return (
    <div className={cn("w-full h-full min-h-[420px] relative", className)}>
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} style={{ width: "100%", height: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LeafletCenterController center={center} zoom={zoom} />
        {userPos && showUserLocation && (
          <Marker position={[userPos.lat, userPos.lng]} icon={userLeafletIcon} />
        )}
      </MapContainer>

      <div className="absolute bottom-3 left-3 right-3 bg-amber-50/95 border border-amber-200 text-amber-900 text-xs rounded-md px-3 py-2 shadow-sm z-[500]">
        {reason}
      </div>
    </div>
  );
}

// Add global declaration for gm_authFailure
declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
  showUserLocation?: boolean;
  onLocationFound?: (lat: number, lng: number) => void;
  onFallback?: () => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
  showUserLocation = true,
  onLocationFound,
  onFallback,
}: MapViewProps) {
  const [authError, setAuthError] = useState(false);
  const [loadTimeoutReached, setLoadTimeoutReached] = useState(false);
  const { apiKey, mapId } = getGoogleMapsClientConfig();

  useEffect(() => {
    // Setup global error handler for Google Maps auth failures
    window.gm_authFailure = () => {
      console.error("Google Maps Authentication Failure: Invalid API Key or billing issue.");
      setAuthError(true);
    };

    return () => {
      // Cleanup
      window.gm_authFailure = undefined;
    };
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: libraries,
  });

  useEffect(() => {
    if (isLoaded || loadError) {
      setLoadTimeoutReached(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setLoadTimeoutReached(true);
    }, 12000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isLoaded, loadError]);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userPos, setUserPos] = useState<google.maps.LatLngLiteral | null>(null);
  
  // Use a ref to track if we've already centered on user to avoid re-centering on every render
  const hasCenteredOnUser = useRef(false);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    console.log("Google Maps loaded successfully");
    setMap(mapInstance);
    if (onMapReady) {
      onMapReady(mapInstance);
    }
  }, [onMapReady]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

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

  const fallbackReason = !apiKey
    ? "Google Maps non configurata. Mostro OpenStreetMap."
    : authError
      ? "Google Maps non autorizzata (key/referrer). Mostro OpenStreetMap."
      : loadError
        ? `Google Maps non disponibile (${loadError.message}). Mostro OpenStreetMap.`
        : loadTimeoutReached && !isLoaded
          ? "Google Maps in timeout. Mostro OpenStreetMap."
          : null;

  useEffect(() => {
    if (fallbackReason) {
      onFallback?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!fallbackReason]);

  if (fallbackReason) {
    return (
      <LeafletFallbackMap
        className={className}
        center={userPos || initialCenter}
        zoom={initialZoom}
        userPos={userPos}
        showUserLocation={showUserLocation}
        reason={fallbackReason}
      />
    );
  }

  if (!isLoaded) {
    return (
      <div className={cn("w-full h-full min-h-[420px] flex items-center justify-center bg-gray-100", className)}>
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-sm text-gray-500">Loading Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full min-h-[420px]", className)}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={userPos || initialCenter}
        zoom={initialZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          ...(mapId ? { mapId } : {}),
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
