import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Search,
  MapPin,
  Star,
  Heart,
  SlidersHorizontal,
  Loader2,
  Users,
  BedDouble,
  Bath,
  Sparkles,
  Minus,
  Plus,
  Map as MapIcon,
  List,
  X,
} from "lucide-react";
import { Link } from "wouter";
import type { DateRange } from "react-day-picker";
import { format, parseISO, isSameDay } from "date-fns";
import { it } from "date-fns/locale";

// ── Leaflet icon fix — module level ───────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const userIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center;"><div style="position:absolute;width:100%;height:100%;background:rgba(59,130,246,0.3);border-radius:50%;animation:pulse 2s infinite;"></div><div style="width:12px;height:12px;background:#2563eb;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function makePriceIcon(price: number, isHovered: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${isHovered ? "#1a1a1a" : "white"};color:${isHovered ? "white" : "#1a1a1a"};border:2px solid ${isHovered ? "#1a1a1a" : "#d1d5db"};border-radius:9999px;padding:5px 10px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2);transform:${isHovered ? "scale(1.12)" : "scale(1)"};transition:all .15s;cursor:pointer;">€${price}</div>`,
    iconSize: [60, 30],
    iconAnchor: [30, 15],
  });
}

// ── Photon geocoder type ──────────────────────────────────────────────────────
type PhotonFeature = {
  geometry: { coordinates: [number, number] }; // [lng, lat]
  properties: { name: string; country?: string; state?: string; city?: string; type?: string };
};

// ── Fallback coords for common cities (when Photon is unavailable) ────────────
const CITY_COORDS: Record<string, [number, number]> = {
  "milano": [45.4642, 9.1900], "milan": [45.4642, 9.1900],
  "roma": [41.9028, 12.4964], "rome": [41.9028, 12.4964],
  "firenze": [43.7696, 11.2558], "florence": [43.7696, 11.2558],
  "venezia": [45.4408, 12.3155], "venice": [45.4408, 12.3155],
  "napoli": [40.8518, 14.2681], "naples": [40.8518, 14.2681],
  "torino": [45.0703, 7.6869], "turin": [45.0703, 7.6869],
  "bologna": [44.4949, 11.3426], "palermo": [38.1157, 13.3615],
  "genova": [44.4056, 8.9463], "genoa": [44.4056, 8.9463],
  "parigi": [48.8566, 2.3522], "paris": [48.8566, 2.3522],
  "londra": [51.5074, -0.1278], "london": [51.5074, -0.1278],
  "barcellona": [41.3851, 2.1734], "barcelona": [41.3851, 2.1734],
  "madrid": [40.4168, -3.7038], "berlino": [52.5200, 13.4050], "berlin": [52.5200, 13.4050],
  "amsterdam": [52.3676, 4.9041], "vienna": [48.2082, 16.3738],
  "praga": [50.0755, 14.4378], "prague": [50.0755, 14.4378],
  "new york": [40.7128, -74.0060], "los angeles": [34.0522, -118.2437],
  "tokyo": [35.6762, 139.6503], "dubai": [25.2048, 55.2708],
  "new york city": [40.7128, -74.0060], "nyc": [40.7128, -74.0060],
};

function cityFallbackCoords(city: string): { lat: number; lng: number } | null {
  const key = city.toLowerCase().trim();
  const found = CITY_COORDS[key] ?? Object.entries(CITY_COORDS).find(([k]) => key.startsWith(k) || k.startsWith(key))?.[1];
  return found ? { lat: found[0], lng: found[1] } : null;
}

// ── Internal map components ───────────────────────────────────────────────────
type Bounds = { north: number; south: number; east: number; west: number };

function BoundsTracker({ onBoundsChange }: { onBoundsChange: (b: Bounds) => void }) {
  const map = useMap();
  useEffect(() => {
    const report = () => {
      const b = map.getBounds();
      onBoundsChange({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
    };
    map.on("moveend", report);
    map.on("zoomend", report);
    report();
    return () => { map.off("moveend", report); map.off("zoomend", report); };
  }, [map, onBoundsChange]);
  return null;
}

function UserLocationMarker({ onFound }: { onFound: (lat: number, lng: number) => void }) {
  const [pos, setPos] = useState<[number, number] | null>(null);
  const map = useMap();
  useEffect(() => {
    const handleFound = (e: L.LocationEvent) => {
      setPos([e.latlng.lat, e.latlng.lng]);
      onFound(e.latlng.lat, e.latlng.lng);
    };
    map.on("locationfound", handleFound);
    map.locate({ setView: false, watch: true, timeout: 10000 });
    return () => { map.off("locationfound", handleFound); map.stopLocate(); };
  }, [map, onFound]);
  if (!pos) return null;
  return <Marker position={pos} icon={userIcon} zIndexOffset={2000} />;
}

// Fly the map smoothly when center changes (Airbnb-style animation)
function FlyToCity({ center }: { center: [number, number] }) {
  const map = useMap();
  const prev = useRef<[number, number] | null>(null);
  useEffect(() => {
    const [lat, lng] = center;
    if (prev.current) {
      const [pLat, pLng] = prev.current;
      if (Math.abs(lat - pLat) > 0.001 || Math.abs(lng - pLng) > 0.001) {
        map.flyTo(center, 10, { duration: 1.2 });
      }
    } else {
      // First render: jump directly without animation
      map.setView(center, 10);
    }
    prev.current = center;
  }, [center, map]);
  return null;
}

// ── Types & utils ─────────────────────────────────────────────────────────────
type Property = {
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
  averageRating?: number;
};

const toNum = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

function parseParams(search: string) {
  const p = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const lat = parseFloat(p.get("lat") || "");
  const lng = parseFloat(p.get("lng") || "");
  return {
    city: p.get("city") || "",
    checkin: p.get("checkin") || "",
    checkout: p.get("checkout") || "",
    adults: parseInt(p.get("adults") || "2"),
    children: parseInt(p.get("children") || "0"),
    pets: parseInt(p.get("pets") || "0"),
    nearbyLat: Number.isFinite(lat) ? lat : null,
    nearbyLng: Number.isFinite(lng) ? lng : null,
  };
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SearchResults() {
  const [, navigate] = useLocation();
  const search = useSearch(); // reactive: updates when URL search changes
  const params = useMemo(() => parseParams(search), [search]);

  // Editable UI state — synced from URL on change
  const [city, setCity] = useState(params.city);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(
    params.nearbyLat !== null ? { lat: params.nearbyLat!, lng: params.nearbyLng! } : null
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = params.checkin ? parseISO(params.checkin) : undefined;
    const to = params.checkout ? parseISO(params.checkout) : undefined;
    return from ? { from, to } : undefined;
  });
  const [adults, setAdults] = useState(params.adults);
  const [children, setChildren] = useState(params.children);
  const [pets, setPets] = useState(params.pets);
  const [dateOpen, setDateOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);

  // Destination autocomplete state
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [photonResults, setPhotonResults] = useState<PhotonFeature[]>([]);
  const [isFetchingDest, setIsFetchingDest] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destRef = useRef<HTMLDivElement>(null);

  // Map & list state
  const [mapBounds, setMapBounds] = useState<Bounds | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const savedDateRangeRef = useRef<DateRange | undefined>(undefined);
  const rangeCompletedRef = useRef(false); // true when user completed a range (vs closing by mistake)

  // Geocoded center when URL has city but no lat/lng
  const [cityGeocodedCenter, setCityGeocodedCenter] = useState<[number, number] | null>(null);

  // Sync UI from URL when params change (e.g. after doSearch / back navigation)
  useEffect(() => {
    setCity(params.city);
    setAdults(params.adults);
    setChildren(params.children);
    setPets(params.pets);
    if (params.nearbyLat !== null && params.nearbyLng !== null) {
      setSelectedCoords({ lat: params.nearbyLat!, lng: params.nearbyLng! });
    } else {
      setSelectedCoords(null);
    }
    setCityGeocodedCenter(null); // reset geocoded center when URL changes
  }, [params.city, params.adults, params.children, params.pets, params.nearbyLat, params.nearbyLng]);

  const hasCoords = params.nearbyLat !== null && params.nearbyLng !== null;
  const gpsNearbyMode = hasCoords && !params.city; // GPS mode: no city text

  // When URL has a city but no lat/lng, geocode it so the map can fly there
  useEffect(() => {
    if (!params.city || hasCoords) return;
    // Try fallback coords immediately (instant)
    const fallback = cityFallbackCoords(params.city);
    if (fallback) { setCityGeocodedCenter([fallback.lat, fallback.lng]); return; }
    let cancelled = false;
    const geocode = async () => {
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(params.city)}&limit=1`
        );
        const data = await res.json();
        const features = (data.features ?? []) as PhotonFeature[];
        if (!cancelled && features.length > 0) {
          const [lng, lat] = features[0].geometry.coordinates;
          setCityGeocodedCenter([lat, lng]);
        }
      } catch { /* ignore */ }
    };
    geocode();
    return () => { cancelled = true; };
  }, [params.city, hasCoords]);

  // Close autocomplete on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (destRef.current && !destRef.current.contains(e.target as Node)) {
        setShowDestSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const { data: allProperties, isLoading } = trpc.properties.list.useQuery(undefined, { retry: 1 });

  // ── Photon autocomplete ───────────────────────────────────────────────────
  const fetchDestSuggestions = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 1) { setPhotonResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setIsFetchingDest(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`
        );
        const data = await res.json();
        setPhotonResults((data.features ?? []) as PhotonFeature[]);
      } catch {
        setPhotonResults([]);
      } finally {
        setIsFetchingDest(false);
      }
    }, 250);
  }, []);

  const handleCityChange = (value: string) => {
    setCity(value);
    setSelectedCoords(null);
    setShowDestSuggestions(true);
    fetchDestSuggestions(value);
  };

  // When user picks from autocomplete: update coords AND immediately navigate
  const selectPhotonResult = useCallback((feature: PhotonFeature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const { name, state, country } = feature.properties;
    const label = [name, state, country].filter(Boolean).slice(0, 2).join(", ");
    setCity(label);
    setSelectedCoords({ lat, lng });
    setPhotonResults([]);
    setShowDestSuggestions(false);
    // Immediately launch search with new coords → URL updates → params reactive → map flies
    const p = new URLSearchParams();
    p.set("city", label);
    p.set("lat", String(lat));
    p.set("lng", String(lng));
    if (dateRange?.from) p.set("checkin", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange?.to) p.set("checkout", format(dateRange.to, "yyyy-MM-dd"));
    p.set("adults", String(adults));
    p.set("children", String(children));
    p.set("pets", String(pets));
    navigate(`/search?${p.toString()}`);
  }, [dateRange, adults, children, pets, navigate]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const cityFiltered = useMemo(() => {
    const src = (allProperties ?? []) as Property[];
    if (gpsNearbyMode) {
      const userLat = params.nearbyLat!;
      const userLng = params.nearbyLng!;
      return [...src].sort((a, b) => {
        const aLat = toNum(a.latitude); const aLng = toNum(a.longitude);
        const bLat = toNum(b.latitude); const bLng = toNum(b.longitude);
        if (aLat === null || aLng === null) return 1;
        if (bLat === null || bLng === null) return -1;
        const dA = Math.sqrt((aLat - userLat) ** 2 + (aLng - userLng) ** 2);
        const dB = Math.sqrt((bLat - userLat) ** 2 + (bLng - userLng) ** 2);
        return dA - dB;
      });
    }
    if (!params.city.trim()) return src;
    const term = params.city.toLowerCase();
    return src.filter((p) =>
      p.city.toLowerCase().includes(term) ||
      p.country.toLowerCase().includes(term) ||
      p.title.toLowerCase().includes(term)
    );
  }, [allProperties, gpsNearbyMode, params.nearbyLat, params.nearbyLng, params.city]);

  const visibleProperties = useMemo(() => {
    if (!mapBounds) return cityFiltered;
    return cityFiltered.filter((p) => {
      const lat = toNum(p.latitude);
      const lng = toNum(p.longitude);
      if (lat === null || lng === null) return true;
      return lat >= mapBounds.south && lat <= mapBounds.north && lng >= mapBounds.west && lng <= mapBounds.east;
    });
  }, [cityFiltered, mapBounds]);

  // Map center: URL coords (GPS or city selection) > geocoded city > property average > Italy default
  const mapCenter = useMemo<[number, number]>(() => {
    if (hasCoords) return [params.nearbyLat!, params.nearbyLng!];
    if (cityGeocodedCenter) return cityGeocodedCenter;
    const valid = cityFiltered.filter((p) => toNum(p.latitude) && toNum(p.longitude));
    if (valid.length === 0) return [41.9028, 12.4964];
    const lat = valid.reduce((s, p) => s + toNum(p.latitude)!, 0) / valid.length;
    const lng = valid.reduce((s, p) => s + toNum(p.longitude)!, 0) / valid.length;
    return [lat, lng];
  }, [cityFiltered, hasCoords, params.nearbyLat, params.nearbyLng, cityGeocodedCenter]);

  const nights =
    dateRange?.from && dateRange?.to
      ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

  useEffect(() => {
    if (!hoveredId) return;
    const el = cardRefs.current.get(hoveredId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [hoveredId]);

  const doSearch = useCallback(async () => {
    const p = new URLSearchParams();
    if (city) p.set("city", city);
    let coords = selectedCoords;
    // If user typed a city without selecting from autocomplete, geocode it
    if (city && !coords) {
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(city)}&limit=1`
        );
        const data = await res.json();
        const features = (data.features ?? []) as PhotonFeature[];
        if (features.length > 0) {
          const [lng, lat] = features[0].geometry.coordinates;
          coords = { lat, lng };
        }
      } catch { /* ignore */ }
      // Fallback to hardcoded list if Photon fails
      if (!coords) coords = cityFallbackCoords(city);
    }
    if (coords) {
      p.set("lat", String(coords.lat));
      p.set("lng", String(coords.lng));
    }
    if (dateRange?.from) p.set("checkin", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange?.to) p.set("checkout", format(dateRange.to, "yyyy-MM-dd"));
    p.set("adults", String(adults));
    p.set("children", String(children));
    p.set("pets", String(pets));
    navigate(`/search?${p.toString()}`);
  }, [city, dateRange, adults, children, pets, navigate, selectedCoords]);

  const goToCheckout = useCallback((property: Property) => {
    const p = new URLSearchParams();
    p.set("propertyId", String(property.id));
    if (dateRange?.from) p.set("checkin", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange?.to) p.set("checkout", format(dateRange.to, "yyyy-MM-dd"));
    p.set("adults", String(adults));
    p.set("children", String(children));
    p.set("pets", String(pets));
    navigate(`/checkout?${p.toString()}`);
  }, [dateRange, adults, children, pets, navigate]);

  const handleBoundsChange = useCallback((b: Bounds) => setMapBounds(b), []);
  const handleLocationFound = useCallback(() => {}, []);

  const formatGuestsLabel = () => {
    const total = adults + children;
    const parts = [`${total} ospit${total !== 1 ? "i" : "e"}`];
    if (pets > 0) parts.push(`${pets} animal${pets !== 1 ? "i" : "e"}`);
    return parts.join(", ");
  };

  return (
    <div className="h-screen flex flex-col bg-white" style={{ overflow: "clip" }}>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:.35} 50%{transform:scale(1.7);opacity:0} }
        .leaflet-container { font-family: inherit; }
        .leaflet-div-icon { background: transparent; border: none; }
      `}</style>

      {/* ── SEARCH NAVBAR ── */}
      <nav className="flex-shrink-0 bg-white border-b border-slate-200 z-[1000] relative">
        <div className="px-4 sm:px-6">
          <div className="flex items-center gap-3 h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-base font-bold text-rose-500 hidden lg:block">LuxuryStay</span>
              </div>
            </Link>

            {/* Search bar */}
            <div className="flex-1 flex items-center border border-slate-300 rounded-full shadow hover:shadow-md bg-white max-w-2xl mx-auto min-w-0">

              {/* Destination + Photon autocomplete */}
              <div ref={destRef} className="flex-1 px-4 py-1.5 min-w-0 relative">
                <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Dove</div>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    onFocus={() => { if (city.length >= 2) setShowDestSuggestions(true); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { setShowDestSuggestions(false); doSearch(); }
                      if (e.key === "Escape") setShowDestSuggestions(false);
                    }}
                    placeholder="Destinazione"
                    className="text-sm text-slate-700 bg-transparent outline-none w-full placeholder-slate-400"
                  />
                  {isFetchingDest && (
                    <div className="w-3 h-3 border-2 border-slate-300 border-t-rose-400 rounded-full animate-spin flex-shrink-0" />
                  )}
                  {city && !isFetchingDest && (
                    <button
                      onClick={() => { setCity(""); setSelectedCoords(null); setPhotonResults([]); setShowDestSuggestions(false); }}
                      className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Photon autocomplete dropdown */}
                {showDestSuggestions && city.length >= 1 && (isFetchingDest || photonResults.length > 0) && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden" style={{ zIndex: 9999 }}>
                    {isFetchingDest ? (
                      <div className="flex items-center gap-2 px-4 py-3 text-slate-400 text-sm">
                        <div className="w-3.5 h-3.5 border-2 border-slate-200 border-t-rose-400 rounded-full animate-spin flex-shrink-0" />
                        Ricerca in corso...
                      </div>
                    ) : (
                      photonResults.map((feat, i) => {
                        const { name, state, country, type } = feat.properties;
                        const line2 = [state, country].filter(Boolean).join(", ");
                        const emoji =
                          type === "city" ? "🏙️" :
                          type === "district" ? "📍" :
                          type === "country" ? "🌍" : "📌";
                        return (
                          <button
                            key={i}
                            onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                            onClick={() => selectPhotonResult(feat)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                          >
                            <span className="text-lg flex-shrink-0">{emoji}</span>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 text-sm truncate">{name}</p>
                              {line2 && <p className="text-xs text-slate-500 truncate">{line2}</p>}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div className="w-px h-5 bg-slate-200 flex-shrink-0" />

              {/* Dates */}
              <Popover
                open={dateOpen}
                onOpenChange={setDateOpen}
              >
                <PopoverTrigger asChild>
                  <button className="px-3 py-1.5 text-left hover:bg-slate-50 transition-colors flex-shrink-0">
                    <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                      {!dateRange?.from ? "Date" : !dateRange?.to ? "Check-out" : "Date"}
                    </div>
                    <div className="text-sm whitespace-nowrap">
                      {dateRange?.from && dateRange?.to ? (
                        <span className="text-slate-700">
                          {format(dateRange.from, "d MMM", { locale: it })} – {format(dateRange.to, "d MMM", { locale: it })}
                        </span>
                      ) : dateRange?.from ? (
                        <span className="text-rose-500 font-medium">
                          {format(dateRange.from, "d MMM", { locale: it })} → ?
                        </span>
                      ) : (
                        <span className="text-slate-400">Aggiungi date</span>
                      )}
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 shadow-xl rounded-2xl" style={{ zIndex: 9999 }} align="center" onOpenAutoFocus={(e) => { e.preventDefault(); const el = (e.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>('[data-slot="calendar"]'); el?.focus(); }} onFocusOutside={(e) => e.preventDefault()}>
                  <div className="px-5 pt-4 pb-2 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">
                      {!dateRange?.from
                        ? "Quando arrivi?"
                        : !dateRange?.to
                        ? "Quando torni a casa?"
                        : "Periodo di soggiorno"}
                    </p>
                    {dateRange?.from && !dateRange?.to && (
                      <p className="text-xs text-slate-400 mt-0.5">Check-in: {format(dateRange.from, "d MMMM yyyy", { locale: it })}</p>
                    )}
                  </div>
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onDayClick={(day, modifiers) => {
                      if (modifiers.disabled) return;
                      if (!dateRange?.from || (dateRange.from && dateRange.to)) {
                        setDateRange({ from: day, to: undefined });
                      } else {
                        const from = dateRange.from;
                        if (isSameDay(day, from)) {
                          setDateRange(undefined);
                        } else if (day < from) {
                          setDateRange({ from: day, to: from });
                          setDateOpen(false);
                        } else {
                          setDateRange({ from, to: day });
                          setDateOpen(false);
                        }
                      }
                    }}
                    numberOfMonths={2}
                    disabled={(day) => { const t = new Date(); t.setHours(0,0,0,0); const d = new Date(day); d.setHours(0,0,0,0); return d < t; }}
                    classNames={{ today: "", range_start: "cal-range-start", range_end: "cal-range-end", range_middle: "cal-range-middle" }}
                    className="rounded-2xl"
                  />
                  {(dateRange?.from || dateRange?.to) && (
                    <div className="px-4 pb-3 flex justify-end">
                      <button
                        onClick={() => {
                          setDateRange(undefined);
                          setDateOpen(false);
                        }}
                        className="text-xs text-slate-400 hover:text-slate-600 underline"
                      >
                        Cancella date
                      </button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              <div className="w-px h-5 bg-slate-200 flex-shrink-0" />

              {/* Guests + Search */}
              <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-r-full transition-colors flex-shrink-0">
                    <div className="text-left hidden sm:block">
                      <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Ospiti</div>
                      <div className="text-sm text-slate-500">{formatGuestsLabel()}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); doSearch(); }}
                      className="w-8 h-8 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-colors"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 shadow-xl rounded-2xl p-4 z-[1001]" align="end">
                  <div className="space-y-4">
                    {[
                      { label: "Adulti", sub: "Età 13+", val: adults, set: setAdults, min: 1 },
                      { label: "Bambini", sub: "Età 2–12", val: children, set: setChildren, min: 0 },
                      { label: "Animali", sub: "da compagnia", val: pets, set: setPets, min: 0 },
                    ].map((g, i) => (
                      <div key={g.label}>
                        {i > 0 && <Separator className="mb-4" />}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">{g.label}</p>
                            <p className="text-xs text-slate-500">{g.sub}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => g.set(Math.max(g.min, g.val - 1))}
                              disabled={g.val <= g.min}
                              className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center hover:border-slate-900 disabled:opacity-30 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-4 text-center text-sm font-medium">{g.val}</span>
                            <button
                              onClick={() => g.set(g.val + 1)}
                              className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center hover:border-slate-900 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Button variant="outline" size="sm" className="rounded-full border-slate-300 hidden sm:flex gap-1.5 flex-shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtri
            </Button>
          </div>
        </div>
      </nav>

      {/* Info bar */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-2 bg-white border-b border-slate-100 flex items-center justify-between text-sm">
        <p className="text-slate-600">
          {isLoading ? (
            <span className="flex items-center gap-1.5 text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />Caricamento...
            </span>
          ) : (
            <>
              <span className="font-semibold text-slate-900">{visibleProperties.length}</span> ville
              {params.city && <> a <span className="font-semibold text-slate-900">{params.city}</span></>}
              {nights > 0 && <> · <span className="font-semibold">{nights} notti</span></>}
              {mapBounds && <span className="text-slate-400 ml-1">(area mappa)</span>}
            </>
          )}
        </p>
      </div>

      {/* ── LIST + MAP ── */}
      <div className="flex-1 flex min-h-0 relative">

        {/* LIST PANEL */}
        <div className={`overflow-y-auto bg-white sm:w-[44%] lg:w-[38%] ${mobileView === "map" ? "hidden sm:block" : "block"}`}>
          <div className="p-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-28 h-28 rounded-xl bg-slate-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                  </div>
                </div>
              ))
            ) : visibleProperties.length === 0 ? (
              <div className="text-center py-16">
                <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Nessuna villa in quest'area</p>
                <p className="text-slate-400 text-sm mt-1">Sposta la mappa o cambia i filtri</p>
              </div>
            ) : (
              visibleProperties.map((property) => (
                <div
                  key={property.id}
                  ref={(el) => { if (el) cardRefs.current.set(property.id, el); }}
                  className={`flex gap-3 cursor-pointer rounded-xl p-2 transition-all ${
                    hoveredId === property.id ? "bg-slate-100 ring-1 ring-slate-300" : "hover:bg-slate-50"
                  }`}
                  onMouseEnter={() => setHoveredId(property.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => goToCheckout(property)}
                >
                  <div className="w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 relative">
                    <img
                      src={property.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=400&fit=crop"}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <button className="absolute top-1.5 right-1.5 text-white/80 hover:text-white" onClick={(e) => e.stopPropagation()}>
                      <Heart className="w-4 h-4 drop-shadow" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900 text-sm leading-tight truncate">{property.title}</p>
                      {property.averageRating && (
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Star className="w-3 h-3 fill-slate-900 text-slate-900" />
                          <span className="text-xs font-semibold">{Number(property.averageRating).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{property.city}, {property.country}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{property.maxGuests}</span>
                      <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{property.bedrooms}</span>
                      <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{property.bathrooms}</span>
                    </div>
                    <div className="mt-2 flex items-end justify-between">
                      <p className="text-sm text-slate-900">
                        <span className="font-bold">€{property.pricePerNight}</span>
                        <span className="text-slate-500"> notte</span>
                      </p>
                      {nights > 0 && <span className="text-xs text-slate-500">€{property.pricePerNight * nights} tot.</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MAP PANEL */}
        <div className={`flex-1 relative ${mobileView === "list" ? "hidden sm:block" : "block"}`}>
          <MapContainer
            center={mapCenter}
            zoom={hasCoords ? 10 : cityFiltered.length > 0 ? 10 : 6}
            style={{ width: "100%", height: "100%" }}
            zoomControl
            className="w-full h-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <BoundsTracker onBoundsChange={handleBoundsChange} />
            <UserLocationMarker onFound={handleLocationFound} />
            {/* Smoothly re-center map when city changes */}
            <FlyToCity center={mapCenter} />

            {cityFiltered.map((property) => {
              const lat = toNum(property.latitude);
              const lng = toNum(property.longitude);
              if (lat === null || lng === null) return null;
              const isHov = hoveredId === property.id;
              return (
                <Marker
                  key={property.id}
                  position={[lat, lng]}
                  icon={makePriceIcon(property.pricePerNight, isHov)}
                  zIndexOffset={isHov ? 1000 : 0}
                  eventHandlers={{
                    mouseover: () => setHoveredId(property.id),
                    mouseout: () => setHoveredId(null),
                    click: () => goToCheckout(property),
                  }}
                >
                  <Popup maxWidth={220} className="rounded-xl overflow-hidden">
                    <div className="w-52 -mx-3 -my-2">
                      <img
                        src={property.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop"}
                        alt={property.title}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-3">
                        <p className="font-semibold text-sm text-slate-900 truncate">{property.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{property.city}, {property.country}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-slate-900 text-sm">
                            €{property.pricePerNight}
                            <span className="font-normal text-slate-500 text-xs"> /notte</span>
                          </span>
                          {property.averageRating && (
                            <span className="flex items-center gap-0.5 text-xs font-semibold">
                              <Star className="w-3 h-3 fill-slate-900 text-slate-900" />
                              {Number(property.averageRating).toFixed(1)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => goToCheckout(property)}
                          className="mt-2 w-full bg-rose-500 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-rose-600 transition-colors"
                        >
                          Prenota ora
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Mobile bottom toggle */}
      <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
        <button
          onClick={() => setMobileView(mobileView === "map" ? "list" : "map")}
          className="flex items-center gap-2 bg-slate-900 text-white rounded-full px-5 py-2.5 text-sm font-semibold shadow-xl"
        >
          {mobileView === "map" ? (
            <><List className="w-4 h-4" />Lista</>
          ) : (
            <><MapIcon className="w-4 h-4" />Mappa</>
          )}
        </button>
      </div>
    </div>
  );
}
