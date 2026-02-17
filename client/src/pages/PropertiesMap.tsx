import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  Bath,
  Bed,
  Loader2,
  MapPin,
  Navigation,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapView } from "@/components/Map";
import { trpc } from "@/lib/trpc";

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
  const [mapCenter, setMapCenter] = useState<Coordinates | undefined>(undefined);
  const [followUser, setFollowUser] = useState(true);

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
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
    toast.error("Errore caricamento ville. Riprova tra poco.");
  }, [error]);

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

        const distance = calculateDistance(
          refLocation.lat,
          refLocation.lng,
          lat,
          lng
        );
        return { ...property, distance };
      })
      .sort((a, b) => {
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
  }, [properties, searchTerm, searchLocation, userLocation, calculateDistance]);

  const mapItems = useMemo(() => {
    return filteredProperties
      .map(p => ({
        id: p.id,
        lat: toNumber(p.latitude) ?? 0,
        lng: toNumber(p.longitude) ?? 0,
        title: p.title,
        price: p.pricePerNight,
      }))
      .filter(p => p.lat !== 0 && p.lng !== 0);
  }, [filteredProperties]);

  const handleUserLocationFound = useCallback(
    (lat: number, lng: number) => {
      const coords = { lat, lng };
      setUserLocation(coords);
      setIsGettingLocation(false);
      if (followUser || (!searchLocation && !mapCenter)) setMapCenter(coords);
    },
    [followUser, searchLocation, mapCenter]
  );

  const getUserLocation = useCallback(() => {
    setIsGettingLocation(true);
    setFollowUser(true);

    if (userLocation) {
      setMapCenter(userLocation);
      setIsGettingLocation(false);
      toast.success("Mappa centrata sulla tua posizione");
      return;
    }

    window.setTimeout(() => {
      setIsGettingLocation(false);
      toast.info("Attendi il rilevamento della posizione...");
    }, 1200);
  }, [userLocation]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);

      if (!value) {
        setSearchLocation(null);
        setSuggestions([]);
        setShowSuggestions(false);
        setFollowUser(true);
        if (userLocation) setMapCenter(userLocation);
        return;
      }

      if (value.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      if (!autocompleteServiceRef.current) return;

      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: value,
          types: ["(cities)"],
          language: "it",
        },
        (predictions, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            setSuggestions(predictions);
            setShowSuggestions(true);
            return;
          }

          setSuggestions([]);
          setShowSuggestions(false);
        }
      );
    },
    [userLocation]
  );

  const handleSuggestionClick = useCallback(
    (placeId: string, description: string) => {
      setSearchTerm(description);
      setShowSuggestions(false);
      setFollowUser(false);

      if (!geocoderRef.current) return;

      geocoderRef.current.geocode({ placeId }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const location = results[0].geometry.location;
          const coords = {
            lat: location.lat(),
            lng: location.lng(),
          };

          setSearchLocation(coords);
          setMapCenter(coords);
          return;
        }
      });
    },
    []
  );

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    try {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    } catch {
      autocompleteServiceRef.current = null;
    }
    try {
      geocoderRef.current = new google.maps.Geocoder();
    } catch {
      geocoderRef.current = null;
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="glass-effect border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <Sparkles className="w-8 h-8 text-primary" />
                <span className="text-2xl font-serif font-bold text-gradient-gold">
                  Luxury Booking
                </span>
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
                  placeholder="Cerca città…"
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

              {showSuggestions && suggestions.length > 0 ? (
                <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto">
                  {suggestions.map(suggestion => (
                    <div
                      key={suggestion.place_id}
                      className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                      onClick={() =>
                        handleSuggestionClick(
                          suggestion.place_id,
                          suggestion.description
                        )
                      }
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{suggestion.description}</span>
                      </div>
                    </div>
                  ))}
                </Card>
              ) : null}
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
                      {property.images?.[0] ? (
                        <img
                          src={property.images[0].imageUrl}
                          alt={property.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-serif font-semibold truncate">
                            {property.title}
                          </h3>
                          <Badge variant="outline" className="ml-2 flex-shrink-0">
                            €{property.pricePerNight}/notte
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                          <MapPin className="w-3 h-3" />
                          {property.city}, {property.country}
                        </p>
                        {property.distance !== undefined ? (
                          <p className="text-xs text-primary font-semibold">
                            {property.distance.toFixed(1)} km di distanza
                          </p>
                        ) : null}
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
          <MapView
            initialCenter={{ lat: 41.9028, lng: 12.4964 }}
            initialZoom={6}
            onMapReady={handleMapReady}
            onLocationFound={handleUserLocationFound}
            className="w-full h-full min-h-[420px]"
            items={mapItems}
            highlightedItemId={hoveredPropertyId}
            onItemHover={setHoveredPropertyId}
            onItemClick={(id: number) => setLocationRoute(`/properties/${id}`)}
            center={mapCenter}
            followUser={followUser}
            fitToUserAndItems={!followUser}
            onLoadFailure={() => {
              toast.warning("Google Maps non disponibile: uso la mappa alternativa.");
            }}
          />
        </div>
      </div>
    </div>
  );
}
