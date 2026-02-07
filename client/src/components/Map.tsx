import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

const libraries: ("places" | "geometry" | "marker")[] = ["places", "geometry", "marker"];

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
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
  showUserLocation = true,
  onLocationFound,
}: MapViewProps) {
  const [authError, setAuthError] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

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

  if (!apiKey) {
    return (
      <div className={cn("w-full h-[500px] flex items-center justify-center bg-gray-100 border border-red-200 text-red-600 p-4", className)}>
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
      <div className={cn("w-full h-[500px] flex items-center justify-center bg-red-50 border border-red-200 text-red-600 p-4", className)}>
        <div>
          <h3 className="font-bold">Error loading Google Maps</h3>
          <p className="text-sm mt-1">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className={cn("w-full h-[500px] flex items-center justify-center bg-red-50 border border-red-200 text-red-600 p-4", className)}>
        <div>
          <h3 className="font-bold">Authentication Error</h3>
          <p className="text-sm mt-1">
            Google Maps API key is invalid or unauthorized. 
            Check browser console for details.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={cn("w-full h-[500px] flex items-center justify-center bg-gray-100", className)}>
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-sm text-gray-500">Loading Maps...</p>
        </div>
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
        onUnmount={onUnmount}
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
