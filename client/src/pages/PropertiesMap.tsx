import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import { MapLeaflet } from "@/components/MapLeaflet";
import {
  Sparkles,
  MapPin,
  Users,
  Bed,
  Bath,
  Search,
  Navigation,
  Loader2,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

type Coordinates = { lat: number; lng: number };

type PropertyWithDistance = {
  id: number;
  title: string;
  city: string;
  country: string;
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  latitude: unknown;
  longitude: unknown;
  images?: Array<{ imageUrl: string }>;
  distance?: number;
};

const toNumber = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function PropertiesMap() {
  const [, setLocationRoute] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredPropertyId, setHoveredPropertyId] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [searchLocation, setSearchLocation] = useState<Coordinates | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [useLeafletFallback, setUseLeafletFallback] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<number, google.maps.Marker>>(new Map());
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const {
    data: properties,
    isLoading,
    error,
  } = trpc.properties.list.useQuery(undefined, {
    retry: 1,
  });

  useEffect(() => {
    if (!error) return;
    console.error("Failed to load properties for map:", error);
    toast.error("Errore caricamento ville. Riprova tra poco.");
  }, [error]);

  const handleGoogleMapFailure = useCallback(
    (reason: "missing_api_key" | "load_error" | "auth_error" | "timeout") => {
      if (useLeafletFallback) return;

      console.warn("Google Maps unavailable, switching to Leaflet fallback:", reason);
      setUseLeafletFallback(true);
      toast.warning("Google Maps non disponibile: attivata mappa alternativa.");
    },
    [useLeafletFallback]
  );

  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  const filteredProperties = useMemo(() => {
    const source = (properties ?? []) as PropertyWithDistance[];

    return source
      .filter(property => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          property.title.toLowerCase().includes(term) ||
          property.city.toLowerCase().includes(term) ||
          property.country.toLowerCase().includes(term)
        );
      })
      .map(property => {
        const refLocation = searchLocation || userLocation;
        const lat = toNumber(property.latitude);
        const lng = toNumber(property.longitude);

        if (!refLocation || lat === null || lng === null) {
          return { ...property, distance: undefined };
        }

        const distance = calculateDistance(refLocation.lat, refLocation.lng, lat, lng);
        return { ...property, distance };
      })
      .sort((a, b) => {
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
  }, [properties, searchTerm, searchLocation, userLocation, calculateDistance]);

  const mapCenter = useMemo(
    () => searchLocation || userLocation || { lat: 41.9028, lng: 12.4964 },
    [searchLocation, userLocation]
  );

  const mapZoom = searchLocation || userLocation ? 11 : 6;

  const leafletProperties = useMemo(
    () =>
      filteredProperties.map(property => ({
        id: property.id,
        title: property.title,
        latitude: toNumber(property.latitude)?.toString() ?? null,
        longitude: toNumber(property.longitude)?.toString() ?? null,
        pricePerNight: property.pricePerNight,
        images: property.images ?? [],
      })),
    [filteredProperties]
  );

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, [clearMarkers]);

  const createMarkerAppearance = useCallback((price: number, highlighted: boolean) => {
    return {
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: highlighted ? 24 : 21,
        fillColor: "#FFFFFF",
        fillOpacity: 1,
        strokeColor: highlighted ? "#A16207" : "#D97706",
        strokeWeight: highlighted ? 3 : 2,
      },
      label: {
        text: `€${price}`,
        color: "#111827",
        fontSize: highlighted ? "13px" : "12px",
        fontWeight: "700",
      },
      zIndex: highlighted ? google.maps.Marker.MAX_ZINDEX + 1 : 1,
    };
  }, []);

  const handleUserLocationFound = useCallback((lat: number, lng: number) => {
    setUserLocation({ lat, lng });
    setIsGettingLocation(false);
  }, []);

  const getUserLocation = useCallback(() => {
    setIsGettingLocation(true);

    if (userLocation && mapRef.current) {
      mapRef.current.setCenter(userLocation);
      mapRef.current.setZoom(12);
      setIsGettingLocation(false);
      toast.success("Mappa centrata sulla tua posizione");
      return;
    }

    setIsGettingLocation(false);
    toast.info("Attendi il rilevamento della posizione...");
  }, [userLocation]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);

    if (!value || value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!autocompleteServiceRef.current) return;

    try {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: value,
          types: ["(cities)"],
          language: "it",
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
            setShowSuggestions(true);
            return;
          }

          console.warn("Places Autocomplete failed:", status);
          if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
            toast.error("Errore API Google: abilita Places API nella Cloud Console");
          }
          setSuggestions([]);
          setShowSuggestions(false);
        }
      );
    } catch (err) {
      console.error("Autocomplete error:", err);
    }
  }, []);

  const handleSuggestionClick = useCallback((placeId: string, description: string) => {
    setSearchTerm(description);
    setShowSuggestions(false);

    if (!geocoderRef.current) return;

    geocoderRef.current.geocode({ placeId }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const location = results[0].geometry.location;
        const coords = {
          lat: location.lat(),
          lng: location.lng(),
        };

        setSearchLocation(coords);

        if (mapRef.current) {
          mapRef.current.setCenter(coords);
          mapRef.current.setZoom(11);
        }
        return;
      }

      console.error("Geocoding failed:", status);
      if (status === "REQUEST_DENIED") {
        toast.error("Errore Geocoding: abilita Geocoding API nella Google Cloud Console");
      } else {
        toast.error(`Errore ricerca posizione: ${status}`);
      }
    });
  }, []);

  const handleMapReady = useCallback(
    (map: google.maps.Map) => {
      if (useLeafletFallback) return;

      mapRef.current = map;

      try {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      } catch (err) {
        console.warn("Places AutocompleteService not available", err);
        autocompleteServiceRef.current = null;
      }

      try {
        geocoderRef.current = new google.maps.Geocoder();
      } catch (err) {
        console.warn("Geocoder not available", err);
        geocoderRef.current = null;
      }
    },
    [useLeafletFallback]
  );

  useEffect(() => {
    if (useLeafletFallback) return;

    const map = mapRef.current;
    if (!map || !window.google?.maps) return;

    clearMarkers();

    if (filteredProperties.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    let hasValidMarkers = false;

    filteredProperties.forEach(property => {
      const lat = toNumber(property.latitude);
      const lng = toNumber(property.longitude);
      if (lat === null || lng === null) return;

      const appearance = createMarkerAppearance(property.pricePerNight, false);
      const marker = new google.maps.Marker({
        map,
        position: { lat, lng },
        title: property.title,
        icon: appearance.icon,
        label: appearance.label,
        zIndex: appearance.zIndex,
      });

      marker.addListener("click", () => {
        setLocationRoute(`/properties/${property.id}`);
      });

      marker.addListener("mouseover", () => {
        setHoveredPropertyId(property.id);
      });

      marker.addListener("mouseout", () => {
        setHoveredPropertyId(current => (current === property.id ? null : current));
      });

      markersRef.current.set(property.id, marker);
      bounds.extend({ lat, lng });
      hasValidMarkers = true;
    });

    if (!hasValidMarkers) return;

    map.fitBounds(bounds);

    google.maps.event.addListenerOnce(map, "idle", () => {
      const zoom = map.getZoom();
      if (zoom && zoom > 14) {
        map.setZoom(14);
      }
    });
  }, [filteredProperties, clearMarkers, createMarkerAppearance, setLocationRoute, useLeafletFallback]);

  useEffect(() => {
    if (useLeafletFallback) return;
    if (!window.google?.maps || filteredProperties.length === 0) return;

    const priceByPropertyId = new Map(
      filteredProperties.map(property => [property.id, property.pricePerNight])
    );

    markersRef.current.forEach((marker, propertyId) => {
      const price = priceByPropertyId.get(propertyId);
      if (!price) return;

      const highlighted = hoveredPropertyId === propertyId;
      const appearance = createMarkerAppearance(price, highlighted);

      marker.setIcon(appearance.icon);
      marker.setLabel(appearance.label);
      marker.setZIndex(appearance.zIndex);
    });
  }, [hoveredPropertyId, filteredProperties, createMarkerAppearance, useLeafletFallback]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="glass-effect border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <Sparkles className="w-8 h-8 text-primary" />
                <span className="text-2xl font-serif font-bold text-gradient-gold">Luxury Booking</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/properties">
                <Button variant="ghost">Lista Ville</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row h-[calc(100vh-73px)]">
        <div className="w-full lg:w-2/5 xl:w-1/3 h-[45vh] lg:h-full overflow-y-auto border-r bg-background order-2 lg:order-1">
          <div className="p-6 space-y-4">
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Cerca città..."
                  value={searchTerm}
                  onChange={e => handleSearchChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="pl-10 pr-12"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2"
                  onClick={getUserLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto">
                  {suggestions.map(suggestion => (
                    <div
                      key={suggestion.place_id}
                      className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                      onClick={() => handleSuggestionClick(suggestion.place_id, suggestion.description)}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{suggestion.description}</span>
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredProperties.length} ville trovate
                {(userLocation || searchLocation) && " • Ordinate per distanza"}
              </p>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-600">Errore nel caricamento delle ville</p>
                </div>
              ) : filteredProperties.length > 0 ? (
                filteredProperties.map(property => (
                  <Card
                    key={property.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                      hoveredPropertyId === property.id ? "ring-2 ring-primary" : ""
                    }`}
                    onMouseEnter={() => setHoveredPropertyId(property.id)}
                    onMouseLeave={() => setHoveredPropertyId(null)}
                    onClick={() => setLocationRoute(`/properties/${property.id}`)}
                  >
                    <div className="flex gap-4">
                      {property.images && property.images.length > 0 && (
                        <img
                          src={property.images[0].imageUrl}
                          alt={property.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-serif font-semibold truncate">{property.title}</h3>
                          <Badge variant="outline" className="ml-2 flex-shrink-0">
                            €{property.pricePerNight}/notte
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                          <MapPin className="w-3 h-3" />
                          {property.city}, {property.country}
                        </p>
                        {property.distance !== undefined && (
                          <p className="text-xs text-primary font-semibold">
                            {property.distance.toFixed(1)} km di distanza
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {property.maxGuests}
                          </span>
                          <span className="flex items-center gap-1">
                            <Bed className="w-3 h-3" />
                            {property.bedrooms}
                          </span>
                          <span className="flex items-center gap-1">
                            <Bath className="w-3 h-3" />
                            {property.bathrooms}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nessuna villa trovata</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 relative h-[55vh] lg:h-full min-h-[420px] order-1 lg:order-2">
          {useLeafletFallback ? (
            <MapLeaflet
              className="w-full h-full min-h-[420px]"
              properties={leafletProperties}
              userLocation={userLocation}
              center={mapCenter}
              zoom={mapZoom}
              hoveredPropertyId={hoveredPropertyId}
              onMarkerClick={id => setLocationRoute(`/properties/${id}`)}
              onMarkerHover={id => setHoveredPropertyId(id)}
            />
          ) : (
            <MapView
              initialCenter={{ lat: 41.9028, lng: 12.4964 }}
              initialZoom={6}
              onMapReady={handleMapReady}
              onLocationFound={handleUserLocationFound}
              onLoadFailure={handleGoogleMapFailure}
              className="w-full h-full min-h-[420px]"
            />
          )}
        </div>
      </div>
    </div>
  );
}
