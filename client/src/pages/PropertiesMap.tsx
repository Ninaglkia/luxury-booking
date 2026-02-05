import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { MapView } from "@/components/Map";
import { 
  Sparkles,
  MapPin,
  Users,
  Bed,
  Bath,
  Maximize,
  Search,
  SlidersHorizontal,
  Navigation,
  Loader2
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function PropertiesMap() {
  const [, setLocationRoute] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredPropertyId, setHoveredPropertyId] = useState<number | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<number, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: properties, isLoading } = trpc.properties.list.useQuery();

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter and sort properties
  const filteredProperties = properties?.filter((property) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      property.title.toLowerCase().includes(term) ||
      property.city.toLowerCase().includes(term) ||
      property.country.toLowerCase().includes(term)
    );
  }).map(property => {
    // Add distance if user location or search location is available
    const refLocation = searchLocation || userLocation;
    if (refLocation && property.latitude && property.longitude) {
      const distance = calculateDistance(
        refLocation.lat,
        refLocation.lng,
        property.latitude,
        property.longitude
      );
      return { ...property, distance };
    }
    return { ...property, distance: undefined };
  }).sort((a, b) => {
    // Sort by distance if available
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    return 0;
  });

  const handleUserLocationFound = (lat: number, lng: number) => {
    setUserLocation({ lat, lng });
    setIsGettingLocation(false);
  };

  // Get user's current location (Manual trigger)
  const getUserLocation = () => {
    setIsGettingLocation(true);
    if (userLocation && mapRef.current) {
      mapRef.current.setCenter(userLocation);
      mapRef.current.setZoom(12);
      setIsGettingLocation(false);
      toast.success("Mappa centrata sulla tua posizione");
    } else {
       // If no location yet, MapView is likely still trying or failed. 
       // We can just wait or let MapView handle it.
       // But for better UX, we can try to force update if we could, 
       // but here we just rely on MapView's watcher.
       toast.info("Attendi il rilevamento della posizione...");
    }
  };


  // Handle autocomplete search
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    if (!value || value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (autocompleteServiceRef.current) {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: value,
          types: ['(cities)'],
          language: 'it',
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (placeId: string, description: string) => {
    setSearchTerm(description);
    setShowSuggestions(false);
    
    if (geocoderRef.current) {
      geocoderRef.current.geocode({ placeId }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const coords = {
            lat: location.lat(),
            lng: location.lng(),
          };
          setSearchLocation(coords);
          
          // Center map on searched location
          if (mapRef.current) {
            mapRef.current.setCenter(coords);
            mapRef.current.setZoom(11);
          }
        }
      });
    }
  };

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    // Initialize Google Maps services
    autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    geocoderRef.current = new google.maps.Geocoder();

    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.map = null;
    });
    markersRef.current.clear();

    if (!filteredProperties || filteredProperties.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    // Create markers for each property
    filteredProperties.forEach((property) => {
      if (!property.latitude || !property.longitude) return;

      const lat = property.latitude;
      const lng = property.longitude;

      // Create custom marker content
      const markerContent = document.createElement('div');
      markerContent.className = 'custom-marker';
      markerContent.innerHTML = `
        <div class="bg-white rounded-full px-3 py-1.5 shadow-lg border-2 border-primary font-semibold text-sm cursor-pointer hover:scale-110 transition-transform ${
          hoveredPropertyId === property.id ? 'scale-125 border-4' : ''
        }">
          €${property.pricePerNight}
        </div>
      `;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat, lng },
        content: markerContent,
        title: property.title,
      });

      // Add click listener
      marker.addListener('click', () => {
        setSelectedPropertyId(property.id);
        setLocationRoute(`/properties/${property.id}`);
      });

      // Add hover listener
      markerContent.addEventListener('mouseenter', () => {
        setHoveredPropertyId(property.id);
        markerContent.style.transform = 'scale(1.2)';
      });

      markerContent.addEventListener('mouseleave', () => {
        setHoveredPropertyId(null);
        markerContent.style.transform = 'scale(1)';
      });

      markersRef.current.set(property.id, marker);
      bounds.extend({ lat, lng });
    });

    // Fit map to show all markers
    if (filteredProperties.length > 0) {
      map.fitBounds(bounds);
    }
  }, [filteredProperties, hoveredPropertyId]);

  // Update marker highlighting on hover
  useEffect(() => {
    markersRef.current.forEach((marker, propertyId) => {
      const markerContent = marker.content as HTMLElement;
      const markerDiv = markerContent.querySelector('div');
      if (markerDiv) {
        if (hoveredPropertyId === propertyId) {
          markerDiv.classList.add('scale-125', 'border-4');
        } else {
          markerDiv.classList.remove('scale-125', 'border-4');
        }
      }
    });
  }, [hoveredPropertyId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
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

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Properties List Sidebar */}
        <div className="w-full md:w-2/5 lg:w-1/3 overflow-y-auto border-r bg-background">
          <div className="p-6 space-y-4">
            {/* Search Bar with Autocomplete */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Cerca città..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
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

              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion) => (
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

            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredProperties?.length || 0} ville trovate
                {(userLocation || searchLocation) && " • Ordinate per distanza"}
              </p>
            </div>

            {/* Properties List */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredProperties && filteredProperties.length > 0 ? (
                filteredProperties.map((property) => (
                  <Card
                    key={property.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                      hoveredPropertyId === property.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onMouseEnter={() => setHoveredPropertyId(property.id)}
                    onMouseLeave={() => setHoveredPropertyId(null)}
                    onClick={() => setLocationRoute(`/properties/${property.id}`)}
                  >
                    <div className="flex gap-4">
                      {(property as any).images && (property as any).images.length > 0 && (
                        <img
                          src={(property as any).images[0].imageUrl}
                          alt={property.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
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
                        {property.distance !== undefined && (
                          <p className="text-xs text-primary font-semibold">
                            📍 {property.distance.toFixed(1)} km di distanza
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

        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            initialCenter={{ lat: 41.9028, lng: 12.4964 }} // Rome, Italy
            initialZoom={6}
            onMapReady={handleMapReady}
            onLocationFound={handleUserLocationFound}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
