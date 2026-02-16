import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

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

const createLeafletPriceIcon = (price: number, highlighted: boolean) => {
  return L.divIcon({
    className: "price-marker-icon",
    html: `
      <div style="
        background-color: ${highlighted ? "#A16207" : "#D97706"};
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-weight: bold;
        font-size: ${highlighted ? "14px" : "12px"};
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        white-space: nowrap;
        border: 2px solid white;
        transform: translate(-50%, -50%);
      ">
        €${price}
      </div>
    `,
    iconSize: [40, 30],
    iconAnchor: [20, 15],
  });
};

type LatLng = { lat: number; lng: number };

export type MapItem = {
  id: number;
  lat: number;
  lng: number;
  title: string;
  price: number;
};

function LeafletViewportController({
  center,
  zoom,
  userPos,
  followUser,
  followUserZoom,
  fitToUserAndItems,
  items,
}: {
  center: LatLng;
  zoom: number;
  userPos: LatLng | null;
  followUser: boolean;
  followUserZoom: number;
  fitToUserAndItems: boolean;
  items: MapItem[];
}) {
  const map = useMap();
  const lastFitAtRef = useRef(0);
  const lastCenterRef = useRef<LatLng | null>(null);

  useEffect(() => {
    if (followUser && userPos) {
      map.setView([userPos.lat, userPos.lng], followUserZoom);
      lastCenterRef.current = { lat: userPos.lat, lng: userPos.lng };
      return;
    }

    if (fitToUserAndItems) {
      const points: Array<[number, number]> = [];
      if (userPos) points.push([userPos.lat, userPos.lng]);
      for (const item of items) points.push([item.lat, item.lng]);

      if (points.length === 1) {
        const [lat, lng] = points[0];
        map.setView([lat, lng], followUserZoom);
        lastCenterRef.current = { lat, lng };
        return;
      }

      if (points.length > 1) {
        const now = Date.now();
        if (now - lastFitAtRef.current < 1500) return;
        lastFitAtRef.current = now;
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
        lastCenterRef.current = center;
        return;
      }
    }

    const last = lastCenterRef.current;
    const changed = !last || last.lat !== center.lat || last.lng !== center.lng;
    if (changed) {
      map.setView([center.lat, center.lng], zoom);
      lastCenterRef.current = center;
    }
  }, [center, zoom, map, userPos, followUser, followUserZoom, fitToUserAndItems, items]);

  return null;
}

function LeafletFallbackMap({
  className,
  center,
  zoom,
  userPos,
  showUserLocation,
  reason,
  showReason = true,
  items = [],
  highlightedItemId,
  onItemClick,
  onItemHover,
  followUser,
  followUserZoom,
  fitToUserAndItems,
}: {
  className?: string;
  center: LatLng;
  zoom: number;
  userPos: LatLng | null;
  showUserLocation: boolean;
  reason: string;
  showReason?: boolean;
  items?: MapItem[];
  highlightedItemId?: number | null;
  onItemClick?: (id: number) => void;
  onItemHover?: (id: number | null) => void;
  followUser: boolean;
  followUserZoom: number;
  fitToUserAndItems: boolean;
}) {
  return (
    <div className={cn("w-full h-full min-h-[420px] relative", className)}>
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} style={{ width: "100%", height: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LeafletViewportController
          center={center}
          zoom={zoom}
          userPos={userPos}
          followUser={followUser}
          followUserZoom={followUserZoom}
          fitToUserAndItems={fitToUserAndItems}
          items={items}
        />
        {userPos && showUserLocation ? (
          <Marker position={[userPos.lat, userPos.lng]} icon={userLeafletIcon} />
        ) : null}
        {items.map(item => (
          <Marker
            key={item.id}
            position={[item.lat, item.lng]}
            icon={createLeafletPriceIcon(item.price, item.id === highlightedItemId)}
            eventHandlers={{
              click: () => onItemClick?.(item.id),
              mouseover: () => onItemHover?.(item.id),
              mouseout: () => onItemHover?.(null),
            }}
          />
        ))}
      </MapContainer>

      {showReason && reason ? (
        <div className="absolute bottom-3 left-3 right-3 bg-amber-50/95 border border-amber-200 text-amber-900 text-xs rounded-md px-3 py-2 shadow-sm z-[500]">
          {reason}
        </div>
      ) : null}
    </div>
  );
}

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
  items?: MapItem[];
  highlightedItemId?: number | null;
  onItemClick?: (id: number) => void;
  onItemHover?: (id: number | null) => void;
  center?: google.maps.LatLngLiteral;
  followUser?: boolean;
  followUserZoom?: number;
  fitToUserAndItems?: boolean;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
  showUserLocation = true,
  onLocationFound,
  onLoadFailure,
  items = [],
  highlightedItemId,
  onItemClick,
  onItemHover,
  center,
  followUser = false,
  followUserZoom = 13,
  fitToUserAndItems = false,
}: MapViewProps) {
  const [authError, setAuthError] = useState(false);
  const [loadTimeoutReached, setLoadTimeoutReached] = useState(false);
  const [mountTimeoutReached, setMountTimeoutReached] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const rawMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim();
  const mapId = rawMapId && rawMapId !== "DEMO_MAP_ID" ? rawMapId : undefined;

  useEffect(() => {
    window.gm_authFailure = () => {
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
    if (loadTimeoutReached && !isLoaded) onLoadFailure?.("timeout");
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

  useEffect(() => {
    if (!isLoaded) {
      setMountTimeoutReached(false);
      return;
    }

    if (loadError) return;

    const timeoutId = window.setTimeout(() => {
      setMountTimeoutReached(true);
    }, 3500);

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
      setMountTimeoutReached(false);
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
        console.warn("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [map, showUserLocation, onLocationFound]);

  useEffect(() => {
    if (!map) return;
    if (!center) return;
    map.panTo(center);
  }, [map, center]);

  useEffect(() => {
    if (!map) return;
    if (!followUser) return;
    if (!userPos) return;
    map.panTo(userPos);
    const currentZoom = map.getZoom();
    if (!currentZoom || currentZoom < followUserZoom) {
      map.setZoom(followUserZoom);
    }
  }, [map, followUser, userPos, followUserZoom]);

  useEffect(() => {
    if (!map) return;
    if (!fitToUserAndItems) return;

    const bounds = new google.maps.LatLngBounds();
    let pointCount = 0;

    if (userPos) {
      bounds.extend(userPos);
      pointCount += 1;
    }
    for (const item of items) {
      bounds.extend({ lat: item.lat, lng: item.lng });
      pointCount += 1;
    }

    if (pointCount === 0) return;
    if (pointCount === 1 && userPos) {
      map.panTo(userPos);
      map.setZoom(followUserZoom);
      return;
    }

    map.fitBounds(bounds, 80);
  }, [map, fitToUserAndItems, items, userPos, followUserZoom]);

  const fallbackReason = !apiKey
    ? "Google Maps non configurata. Mostro OpenStreetMap."
    : authError
      ? "Google Maps non autorizzata (key/referrer). Mostro OpenStreetMap."
      : loadError
        ? `Google Maps non disponibile (${loadError.message}). Mostro OpenStreetMap.`
        : loadTimeoutReached && !isLoaded
          ? "Google Maps in timeout. Mostro OpenStreetMap."
          : mountTimeoutReached && isLoaded
            ? "Google Maps non si avvia correttamente. Mostro OpenStreetMap."
            : null;

  if (fallbackReason) {
    return (
      <LeafletFallbackMap
        className={className}
        center={center || userPos || initialCenter}
        zoom={initialZoom}
        userPos={userPos}
        showUserLocation={showUserLocation}
        reason={fallbackReason}
        showReason
        items={items}
        highlightedItemId={highlightedItemId}
        onItemClick={onItemClick}
        onItemHover={onItemHover}
        followUser={followUser}
        followUserZoom={followUserZoom}
        fitToUserAndItems={fitToUserAndItems}
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

  const getMarkerAppearance = (price: number, highlighted: boolean) => {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: highlighted ? 24 : 21,
      fillColor: "#FFFFFF",
      fillOpacity: 1,
      strokeColor: highlighted ? "#A16207" : "#D97706",
      strokeWeight: highlighted ? 3 : 2,
      label: {
        text: `€${price}`,
        color: "#111827",
        fontSize: highlighted ? "13px" : "12px",
        fontWeight: "700",
      },
    };
  };

  return (
    <div className={cn("w-full h-full min-h-[420px]", className)}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center || userPos || initialCenter}
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
        {userPos && showUserLocation ? (
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
        ) : null}
        {items.map(item => {
          const appearance = getMarkerAppearance(item.price, item.id === highlightedItemId);
          return (
            <MarkerF
              key={item.id}
              position={{ lat: item.lat, lng: item.lng }}
              title={item.title}
              icon={{
                path: appearance.path,
                scale: appearance.scale,
                fillColor: appearance.fillColor,
                fillOpacity: appearance.fillOpacity,
                strokeColor: appearance.strokeColor,
                strokeWeight: appearance.strokeWeight,
              }}
              label={appearance.label}
              zIndex={item.id === highlightedItemId ? 999 : 1}
              onClick={() => onItemClick?.(item.id)}
              onMouseOver={() => onItemHover?.(item.id)}
              onMouseOut={() => onItemHover?.(null)}
            />
          );
        })}
      </GoogleMap>
    </div>
  );
}
