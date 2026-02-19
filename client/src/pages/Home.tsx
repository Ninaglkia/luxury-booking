import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  MapPin,
  Search,
  Star,
  Users,
  ChevronDown,
  Minus,
  Plus,
  Globe,
  Home as HomeIcon,
  PawPrint,
  Baby,
  User,
  Heart,
  Sparkles,
  Navigation,
  TrendingUp,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import type { DateRange } from "react-day-picker";
import { format, isSameDay } from "date-fns";
import { it } from "date-fns/locale";

type Mode = "travel" | "host";

// Photon API (OpenStreetMap geocoder) — free, no API key
type PhotonFeature = {
  geometry: { coordinates: [number, number] }; // [lng, lat]
  properties: { name: string; country?: string; state?: string; city?: string; type?: string };
};

const POPULAR_DESTINATIONS = [
  { label: "Roma",     sublabel: "Arte, storia e dolce vita",  icon: "🏛️", lat: 41.9028, lng: 12.4964 },
  { label: "Milano",   sublabel: "Moda, design e aperitivo",   icon: "🏙️", lat: 45.4642, lng:  9.1900 },
  { label: "Firenze",  sublabel: "Rinascimento e Toscana",     icon: "⛪",  lat: 43.7696, lng: 11.2558 },
  { label: "Amalfi",   sublabel: "Costa mozzafiato",           icon: "🌊", lat: 40.6339, lng: 14.6027 },
  { label: "Venezia",  sublabel: "La Serenissima",             icon: "🚣", lat: 45.4408, lng: 12.3155 },
  { label: "Sicilia",  sublabel: "Sole, mare e barocco",       icon: "🏝️", lat: 37.5999, lng: 14.0154 },
  { label: "Sardegna", sublabel: "Acque cristalline",          icon: "🐚", lat: 40.1209, lng:  9.0129 },
  { label: "Napoli",   sublabel: "Pizza, sole e Vesuvio",      icon: "🍕", lat: 40.8518, lng: 14.2681 },
];

const CATEGORIES = [
  { label: "Villa con piscina", icon: "🏊", value: "piscina" },
  { label: "Vista mare", icon: "🌊", value: "mare" },
  { label: "Campagna", icon: "🌿", value: "campagna" },
  { label: "Lago", icon: "🏔️", value: "lago" },
  { label: "Lusso", icon: "✨", value: "lusso" },
  { label: "Design", icon: "🎨", value: "design" },
  { label: "Montagna", icon: "⛰️", value: "montagna" },
  { label: "Isola", icon: "🏝️", value: "isola" },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>("travel");
  const [destination, setDestination] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState(0);
  const [dateOpen, setDateOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState<"destination" | "checkin" | "checkout" | "guests" | null>(null);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photonResults, setPhotonResults] = useState<PhotonFeature[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  // Saves the complete date range before the user starts re-selecting
  const savedDateRangeRef = useRef<DateRange | undefined>(undefined);
  const rangeCompletedRef = useRef(false); // true when user intentionally completed or cancelled

  const { data: properties, isLoading } = trpc.properties.list.useQuery(undefined, { retry: 1 });
  const featured = properties?.slice(0, 8) ?? [];
  const totalGuests = adults + children;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setActiveSearchField(null);
        setShowDestSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleNearby = () => {
    if (!navigator.geolocation) {
      toast.error("Il tuo browser non supporta la geolocalizzazione");
      return;
    }
    setDestination("Nelle vicinanze...");
    setShowDestSuggestions(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const params = new URLSearchParams();
        params.set("lat", String(pos.coords.latitude));
        params.set("lng", String(pos.coords.longitude));
        params.set("adults", String(adults));
        params.set("children", String(children));
        params.set("pets", String(pets));
        navigate(`/search?${params.toString()}`);
      },
      (err) => {
        setDestination("");
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Permesso di localizzazione negato. Abilitalo nelle impostazioni del browser.");
        } else {
          toast.error("Impossibile ottenere la tua posizione. Riprova.");
        }
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  // Fetch autocomplete suggestions from Photon (OpenStreetMap geocoder)
  const fetchSuggestions = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setPhotonResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setIsFetching(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=it`
        );
        const data = await res.json();
        setPhotonResults((data.features ?? []) as PhotonFeature[]);
      } catch {
        setPhotonResults([]);
      } finally {
        setIsFetching(false);
      }
    }, 300);
  };

  const handleDestinationChange = (value: string) => {
    setDestination(value);
    setSelectedCoords(null); // clear coords when user edits manually
    setShowDestSuggestions(true);
    fetchSuggestions(value);
  };

  // Select from popular destinations (pre-baked coords)
  const selectDestination = (dest: typeof POPULAR_DESTINATIONS[0]) => {
    setDestination(dest.label);
    setSelectedCoords({ lat: dest.lat, lng: dest.lng });
    setPhotonResults([]);
    setShowDestSuggestions(false);
    setActiveSearchField("checkin");
    setDateOpen(true);
  };

  // Select from Photon API results
  const selectPhotonResult = (feature: PhotonFeature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const { name, state, country } = feature.properties;
    const label = [name, state, country].filter(Boolean).slice(0, 2).join(", ");
    setDestination(label);
    setSelectedCoords({ lat, lng });
    setPhotonResults([]);
    setShowDestSuggestions(false);
    setActiveSearchField("checkin");
    setDateOpen(true);
  };

  const handleSearch = () => {
    if (!destination.trim()) return;
    const params = new URLSearchParams();
    params.set("city", destination);
    // Include coordinates so SearchResults can center the map precisely
    if (selectedCoords) {
      params.set("lat", String(selectedCoords.lat));
      params.set("lng", String(selectedCoords.lng));
    }
    if (dateRange?.from) params.set("checkin", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange?.to) params.set("checkout", format(dateRange.to, "yyyy-MM-dd"));
    params.set("adults", String(adults));
    params.set("children", String(children));
    params.set("pets", String(pets));
    navigate(`/search?${params.toString()}`);
  };

  const formatDateLabel = () => {
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, "d MMM", { locale: it })} – ${format(dateRange.to, "d MMM", { locale: it })}`;
    }
    if (dateRange?.from) {
      return format(dateRange.from, "d MMM", { locale: it });
    }
    return null;
  };

  const formatGuestsLabel = () => {
    const parts: string[] = [];
    if (adults > 0) parts.push(`${adults} adult${adults !== 1 ? "i" : "o"}`);
    if (children > 0) parts.push(`${children} bambin${children !== 1 ? "i" : "o"}`);
    if (pets > 0) parts.push(`${pets} animal${pets !== 1 ? "i" : "e"}`);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-lg font-bold text-rose-500 hidden sm:block">LuxuryStay</span>
              </div>
            </Link>

            {/* Mode Toggle */}
            <div className="flex items-center bg-slate-100 rounded-full p-1 gap-1">
              <button
                onClick={() => setMode("travel")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  mode === "travel"
                    ? "bg-white shadow text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Viaggia
              </button>
              <button
                onClick={() => setMode("host")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  mode === "host"
                    ? "bg-white shadow text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Ospita
              </button>
            </div>

            {/* Right Nav */}
            <div className="flex items-center gap-2">
              {mode === "host" && (
                <Link href="/become-host">
                  <Button variant="ghost" size="sm" className="text-sm font-medium hidden sm:flex">
                    Metti in affitto il tuo spazio
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Globe className="w-4 h-4" />
              </Button>
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <button className="flex items-center gap-2 border border-slate-300 rounded-full px-3 py-1.5 hover:shadow-md transition-shadow">
                    <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold">
                      {user?.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <span className="text-sm font-medium text-slate-700 hidden sm:block">
                      {user?.name?.split(" ")[0]}
                    </span>
                  </button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <button className="flex items-center gap-2 border border-slate-300 rounded-full px-3 py-1.5 hover:shadow-md transition-shadow">
                    <User className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700 hidden sm:block">Accedi / Registrati</span>
                  </button>
                </a>
              )}
            </div>
          </div>
        </div>
      </nav>

      {mode === "travel" ? (
        <>
          {/* ── HERO + SEARCH BAR ── */}
          <section className="pt-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
              {/* Airbnb-style Search Bar */}
              <div
                ref={searchRef}
                className="max-w-3xl mx-auto"
              >
                {/* Compact bar visible by default */}
                <div
                  className={`flex items-center border border-slate-300 rounded-full shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-white ${
                    activeSearchField ? "ring-2 ring-slate-900 ring-offset-2" : ""
                  }`}
                >
                  {/* Destination */}
                  <div className="flex-1 relative">
                    <div
                      className={`px-6 py-3 rounded-full cursor-pointer ${
                        activeSearchField === "destination" ? "bg-white shadow-inner rounded-full" : "hover:bg-slate-50"
                      }`}
                      onClick={() => { setActiveSearchField("destination"); setShowDestSuggestions(true); }}
                    >
                      <div className="text-xs font-bold text-slate-800">Dove</div>
                      <input
                        type="text"
                        placeholder="Cerca destinazione"
                        value={destination}
                        onChange={(e) => handleDestinationChange(e.target.value)}
                        onFocus={() => { setActiveSearchField("destination"); setShowDestSuggestions(true); }}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="bg-transparent text-sm text-slate-600 placeholder-slate-400 outline-none w-full"
                      />
                    </div>

                    {/* Destinations dropdown */}
                    {showDestSuggestions && (
                      <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50">

                        {/* ── Photon autocomplete results ── */}
                        {photonResults.length > 0 ? (
                          <>
                            <div className="px-4 pt-3 pb-1">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                Risultati ricerca
                              </p>
                            </div>
                            {photonResults.map((feat, i) => {
                              const { name, state, country, type } = feat.properties;
                              const line1 = name;
                              const line2 = [state, country].filter(Boolean).join(", ");
                              const typeEmoji =
                                type === "city" ? "🏙️" :
                                type === "district" ? "📍" :
                                type === "country" ? "🌍" : "📌";
                              return (
                                <button
                                  key={i}
                                  onClick={() => selectPhotonResult(feat)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                                >
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-xl">
                                    {typeEmoji}
                                  </div>
                                  <div className="text-left min-w-0">
                                    <p className="font-semibold text-slate-900 text-sm truncate">{line1}</p>
                                    {line2 && <p className="text-xs text-slate-500 truncate">{line2}</p>}
                                  </div>
                                </button>
                              );
                            })}
                          </>
                        ) : (
                          <>
                            {/* Loading spinner */}
                            {isFetching && (
                              <div className="flex items-center gap-2 px-4 py-3 text-xs text-slate-400">
                                <div className="w-3 h-3 border-2 border-slate-300 border-t-rose-400 rounded-full animate-spin" />
                                Ricerca in corso…
                              </div>
                            )}

                            {/* Nelle vicinanze */}
                            <button
                              onClick={handleNearby}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                            >
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <Navigation className="w-5 h-5 text-slate-700" />
                              </div>
                              <div className="text-left">
                                <p className="font-semibold text-slate-900 text-sm">Nelle vicinanze</p>
                                <p className="text-xs text-slate-500">Scopri le opzioni intorno a te</p>
                              </div>
                            </button>

                            <div className="px-4 pt-2 pb-1">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                                <TrendingUp className="w-3 h-3" />
                                Mete più richieste
                              </p>
                            </div>

                            {/* Popular destinations (filtered by typed text) */}
                            {POPULAR_DESTINATIONS.filter(d =>
                              !destination || d.label.toLowerCase().includes(destination.toLowerCase())
                            ).map((dest) => (
                              <button
                                key={dest.label}
                                onClick={() => selectDestination(dest)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                              >
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-xl">
                                  {dest.icon}
                                </div>
                                <div className="text-left">
                                  <p className="font-semibold text-slate-900 text-sm">{dest.label}</p>
                                  <p className="text-xs text-slate-500">{dest.sublabel}</p>
                                </div>
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="w-px h-6 bg-slate-200" />

                  {/* Check-in */}
                  <Popover
                    open={dateOpen}
                    onOpenChange={setDateOpen}
                  >
                    <PopoverTrigger asChild>
                      <div
                        className={`px-5 py-3 cursor-pointer ${
                          activeSearchField === "checkin" ? "bg-white shadow-inner rounded-full" : "hover:bg-slate-50"
                        }`}
                        onClick={() => setActiveSearchField("checkin")}
                      >
                        <div className="text-xs font-bold text-slate-800">Check-in</div>
                        <div className="text-sm text-slate-500">
                          {dateRange?.from ? format(dateRange.from, "d MMM", { locale: it }) : "Aggiungi date"}
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 shadow-xl border border-slate-200 rounded-2xl" align="center" onOpenAutoFocus={(e) => { e.preventDefault(); const el = (e.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>('[data-slot="calendar"]'); el?.focus(); }} onFocusOutside={(e) => e.preventDefault()}>
                      <div className="px-5 pt-4 pb-2 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900">
                          {!dateRange?.from
                            ? "Quando arrivi?"
                            : !dateRange?.to
                            ? "Quando torni a casa?"
                            : "Periodo di soggiorno"}
                        </p>
                        {dateRange?.from && !dateRange?.to && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Check-in: {format(dateRange.from, "d MMMM yyyy", { locale: it })}
                          </p>
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

                  <div className="w-px h-6 bg-slate-200" />

                  {/* Check-out */}
                  <div
                    className={`px-5 py-3 cursor-pointer ${
                      activeSearchField === "checkout" ? "bg-white shadow-inner rounded-full" : "hover:bg-slate-50"
                    }`}
                    onClick={() => {
                      setActiveSearchField("checkout");
                      setDateOpen(true);
                    }}
                  >
                    <div className="text-xs font-bold text-slate-800">Check-out</div>
                    <div className="text-sm text-slate-500">
                      {dateRange?.to ? format(dateRange.to, "d MMM", { locale: it }) : "Aggiungi date"}
                    </div>
                  </div>

                  <div className="w-px h-6 bg-slate-200" />

                  {/* Guests */}
                  <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
                    <PopoverTrigger asChild>
                      <div
                        className="flex items-center gap-2 px-5 py-3 cursor-pointer hover:bg-slate-50 rounded-r-full"
                        onClick={() => setActiveSearchField("guests")}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800">Ospiti</div>
                          <div className="text-sm text-slate-500">
                            {formatGuestsLabel() || "Aggiungi ospiti"}
                          </div>
                        </div>
                        {/* Search Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSearch();
                          }}
                          className="ml-2 w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-colors flex-shrink-0"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 shadow-xl border border-slate-200 rounded-2xl p-4" align="end">
                      <div className="space-y-4">
                        {/* Adults */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-600" />
                              <span className="font-medium text-slate-900">Adulti</span>
                            </div>
                            <p className="text-xs text-slate-500">Età 13+</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setAdults(Math.max(1, adults - 1))}
                              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:border-slate-900 transition-colors disabled:opacity-40"
                              disabled={adults <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center font-medium">{adults}</span>
                            <button
                              onClick={() => setAdults(adults + 1)}
                              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:border-slate-900 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <Separator />

                        {/* Children */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Baby className="w-4 h-4 text-slate-600" />
                              <span className="font-medium text-slate-900">Bambini</span>
                            </div>
                            <p className="text-xs text-slate-500">Età 2–12</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setChildren(Math.max(0, children - 1))}
                              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:border-slate-900 transition-colors disabled:opacity-40"
                              disabled={children <= 0}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center font-medium">{children}</span>
                            <button
                              onClick={() => setChildren(children + 1)}
                              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:border-slate-900 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <Separator />

                        {/* Pets */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <PawPrint className="w-4 h-4 text-slate-600" />
                              <span className="font-medium text-slate-900">Animali</span>
                            </div>
                            <p className="text-xs text-slate-500">
                              <span className="underline cursor-pointer">Portare un animale da compagnia?</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setPets(Math.max(0, pets - 1))}
                              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:border-slate-900 transition-colors disabled:opacity-40"
                              disabled={pets <= 0}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center font-medium">{pets}</span>
                            <button
                              onClick={() => setPets(pets + 1)}
                              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:border-slate-900 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </section>

          {/* ── CATEGORIES ── */}
          <section className="border-b border-slate-200 bg-white sticky top-16 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-center gap-8 overflow-x-auto py-4 scrollbar-hide">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => navigate(`/search?category=${cat.value}`)}
                    className="flex flex-col items-center gap-1.5 min-w-[60px] group opacity-70 hover:opacity-100 transition-opacity pb-1 border-b-2 border-transparent hover:border-slate-900"
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-xs font-medium text-slate-700 whitespace-nowrap">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── FEATURED PROPERTIES ── */}
          <section className="py-8 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="space-y-3">
                      <div className="aspect-square bg-slate-200 animate-pulse rounded-xl" />
                      <div className="h-4 bg-slate-200 rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : featured.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {featured.map((property) => (
                    <Link
                      key={property.id}
                      href={`/properties/${property.id}`}
                    >
                      <div className="group cursor-pointer">
                        <div className="relative aspect-square rounded-xl overflow-hidden">
                          <img
                            src={
                              (property as any).images?.[0]?.imageUrl ||
                              "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=800&fit=crop"
                            }
                            alt={property.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            className="absolute top-3 right-3 p-1.5 rounded-full text-white/80 hover:text-white transition-colors"
                            onClick={(e) => e.preventDefault()}
                          >
                            <Heart className="w-5 h-5 drop-shadow" />
                          </button>
                          {(property as any).averageRating && (
                            <Badge className="absolute top-3 left-3 bg-white text-slate-900 text-xs font-semibold border-0 shadow">
                              Guest Favorite
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2.5 space-y-1">
                          <div className="flex items-start justify-between">
                            <p className="font-semibold text-slate-900 truncate">
                              {property.city}, {property.country}
                            </p>
                            {(property as any).averageRating && (
                              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                <Star className="w-3.5 h-3.5 fill-slate-900 text-slate-900" />
                                <span className="text-sm text-slate-900">
                                  {Number((property as any).averageRating).toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-slate-500 text-sm truncate">{property.title}</p>
                          <p className="text-slate-500 text-sm">
                            {formatDateLabel() || "Disponibile"}
                          </p>
                          <p className="text-slate-900 text-sm">
                            <span className="font-semibold">€{property.pricePerNight}</span>
                            <span className="text-slate-500"> notte</span>
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-slate-400 text-lg">Nessuna villa disponibile al momento</p>
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        /* ── HOST MODE ── */
        <section className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <div className="max-w-2xl">
              <h1 className="text-5xl font-bold text-slate-900 leading-tight">
                Ospita con LuxuryStay
              </h1>
              <p className="mt-6 text-xl text-slate-600">
                Guadagna affittando la tua villa a viaggiatori selezionati.
                Gestisci disponibilità, prezzi e prenotazioni dalla tua dashboard.
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-5 bg-slate-50 rounded-2xl">
                  <div className="text-3xl mb-3">💶</div>
                  <h3 className="font-semibold text-slate-900">Guadagna di più</h3>
                  <p className="text-sm text-slate-600 mt-1">Prezzi flessibili e pagamenti rapidi</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl">
                  <div className="text-3xl mb-3">🛡️</div>
                  <h3 className="font-semibold text-slate-900">Protezione Host</h3>
                  <p className="text-sm text-slate-600 mt-1">Ospiti verificati e garanzia danni</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl">
                  <div className="text-3xl mb-3">📱</div>
                  <h3 className="font-semibold text-slate-900">Gestione semplice</h3>
                  <p className="text-sm text-slate-600 mt-1">Calendario, messaggi e stats in tempo reale</p>
                </div>
              </div>
              <div className="mt-8 flex items-center gap-4">
                {isAuthenticated ? (
                  user?.role === "guest" ? (
                    <Link href="/become-host">
                      <Button className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 text-base rounded-xl">
                        Inizia a ospitare
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/host/properties/new">
                      <Button className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 text-base rounded-xl">
                        Aggiungi la tua villa
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )
                ) : (
                  <a href={getLoginUrl()}>
                    <Button className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 text-base rounded-xl">
                      Inizia subito
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                )}
                <Link href="/host/dashboard">
                  <Button variant="outline" className="px-8 py-3 text-base rounded-xl border-slate-300">
                    Dashboard Host
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Host features */}
          <div className="bg-slate-50 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h2 className="text-3xl font-bold text-slate-900 mb-10">Come funziona</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { step: "1", title: "Pubblica il tuo annuncio", desc: "Descrivi la tua villa, carica le foto e imposta il prezzo in meno di 10 minuti.", icon: HomeIcon },
                  { step: "2", title: "Accogli gli ospiti", desc: "Ricevi richieste, comunica con i tuoi ospiti e gestisci il calendario delle prenotazioni.", icon: Users },
                  { step: "3", title: "Ricevi i pagamenti", desc: "Accredito automatico sul tuo conto entro 24 ore dal check-in dell'ospite.", icon: Star },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg">{item.title}</h3>
                      <p className="text-slate-600 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-300 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Supporto</h4>
              <div className="space-y-2 text-sm">
                <div className="hover:text-white cursor-pointer">Centro assistenza</div>
                <div className="hover:text-white cursor-pointer">AirCover</div>
                <div className="hover:text-white cursor-pointer">Anti-discriminazione</div>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Ospita</h4>
              <div className="space-y-2 text-sm">
                <Link href="/become-host" className="block hover:text-white">Metti in affitto</Link>
                <Link href="/host/dashboard" className="block hover:text-white">Dashboard Host</Link>
                <Link href="/host/properties/new" className="block hover:text-white">Aggiungi villa</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">LuxuryStay</h4>
              <div className="space-y-2 text-sm">
                <Link href="/search" className="block hover:text-white">Esplora ville</Link>
                <Link href="/search" className="block hover:text-white">Mappa interattiva</Link>
                <Link href="/messages" className="block hover:text-white">Messaggi</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Account</h4>
              <div className="space-y-2 text-sm">
                <Link href="/profile" className="block hover:text-white">Profilo</Link>
                <Link href="/dashboard" className="block hover:text-white">Dashboard</Link>
                <Link href="/dashboard" className="block hover:text-white">Prenotazioni</Link>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <span>© 2026 LuxuryStay, Inc.</span>
            <div className="flex items-center gap-4">
              <span className="hover:text-white cursor-pointer">Privacy</span>
              <span className="hover:text-white cursor-pointer">Termini</span>
              <span className="hover:text-white cursor-pointer">Mappa del sito</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
