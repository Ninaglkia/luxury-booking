import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

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
  onLoadFailure?: (reason: "missing_api_key" | "load_error" | "auth_error" | "timeout") => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
  showUserLocation = true,
  onLocationFound,
  onLoadFailure,
}: MapViewProps) {
  const [authError, setAuthError] = useState(false);
  const [loadTimeoutReached, setLoadTimeoutReached] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const rawMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim();
  const mapId = rawMapId && rawMapId !== "DEMO_MAP_ID" ? rawMapId : undefined;

  useEffect(() => {
    window.gm_authFailure = () => {
      console.error("Google Maps Authentication Failure: Invalid API Key or billing issue.");
      setAuthError(true);
    };

    return () => {
      window.gm_authFailure = undefined;
    };
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });

  useEffect(() => {
    if (!apiKey) onLoadFailure?.("missing_api_key");
  }, [apiKey, onLoadFailure]);

  useEffect(() => {
    if (loadError) onLoadFailure?.("load_error");
  }, [loadError, onLoadFailure]);

  useEffect(() => {
    if (authError) onLoadFailure?.("auth_error");
  }, [authError, onLoadFailure]);

  useEffect(() => {
    if (loadTimeoutReached && !isLoaded) {
      onLoadFailure?.("timeout");
    }
  }, [loadTimeoutReached, isLoaded, onLoadFailure]);

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
  const hasCenteredOnUser = useRef(false);

  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance);
      onMapReady?.(mapInstance);
    },
    [onMapReady]
  );

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  useEffect(() => {
    if (!showUserLocation || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      position => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setUserPos(pos);
        onLocationFound?.(pos.lat, pos.lng);

        if (map && !hasCenteredOnUser.current) {
          map.setCenter(pos);
          hasCenteredOnUser.current = true;
        }
      },
      error => {
        console.warn("Geolocation permission denied or error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [map, showUserLocation, onLocationFound]);

  if (!apiKey) {
    return (
      <div className={cn("w-full h-full min-h-[420px] flex items-center justify-center bg-gray-100 border border-red-200 text-red-600 p-4", className)}>
        <div>
          <h3 className="font-bold">Configuration Error</h3>
          <p>Google Maps API Key is missing in environment variables.</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    console.error("Google Maps Load Error:", loadError);
    return (
      <div className={cn("w-full h-full min-h-[420px] flex items-center justify-center bg-red-50 border border-red-200 text-red-600 p-4", className)}>
        <div>
          <h3 className="font-bold">Error loading Google Maps</h3>
          <p className="text-sm mt-1">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className={cn("w-full h-full min-h-[420px] flex items-center justify-center bg-red-50 border border-red-200 text-red-600 p-4", className)}>
        <div>
          <h3 className="font-bold">Authentication Error</h3>
          <p className="text-sm mt-1">Google Maps API key is invalid or unauthorized.</p>
        </div>
      </div>
    );
  }

  if (loadTimeoutReached && !isLoaded) {
    return (
      <div className={cn("w-full h-full min-h-[420px] flex items-center justify-center bg-red-50 border border-red-200 text-red-600 p-4", className)}>
        <div>
          <h3 className="font-bold">Google Maps timeout</h3>
          <p className="text-sm mt-1">La mappa non risponde. Verifica API key e restrizioni dominio.</p>
        </div>
      </div>
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
        mapContainerStyle={{ width: "100%", height: "100%" }}
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
