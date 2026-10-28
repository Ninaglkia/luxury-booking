import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  CalendarDays,
  ChevronDown,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Search,
  Users,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, isValid, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

type Destination = {
  label: string;
  description: string;
  lat: number;
  lng: number;
};
const destinations: Destination[] = [
  {
    label: "Amalfi",
    description: "Il mare, a un passo da casa",
    lat: 40.6339,
    lng: 14.6027,
  },
  {
    label: "Toscana",
    description: "Tra colline e borghi senza tempo",
    lat: 43.7696,
    lng: 11.2558,
  },
  {
    label: "Sardegna",
    description: "Un'altra sfumatura di azzurro",
    lat: 40.1209,
    lng: 9.0129,
  },
  {
    label: "Sicilia",
    description: "Luce, storia e Mediterraneo",
    lat: 37.5999,
    lng: 14.0154,
  },
];

export default function StaySearch({
  initialSearch = "",
}: {
  initialSearch?: string;
}) {
  const [, navigate] = useLocation();
  const [destination, setDestination] = useState("");
  const [selected, setSelected] = useState<Destination | null>(null);
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [searching, setSearching] = useState(false);
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>();
  const [counts, setCounts] = useState({ adults: 2, children: 0, pets: 0 });
  const wrapper = useRef<HTMLDivElement>(null);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  useEffect(() => {
    const params = new URLSearchParams(initialSearch);
    setDestination(params.get("city") ?? "");
    const lat = params.get("lat") ? Number(params.get("lat")) : NaN;
    const lng = params.get("lng") ? Number(params.get("lng")) : NaN;
    setSelected(
      Number.isFinite(lat) && Number.isFinite(lng)
        ? { label: params.get("city") ?? "", description: "", lat, lng }
        : null
    );
    const from = params.get("checkin")
      ? parseISO(params.get("checkin")!)
      : undefined;
    const to = params.get("checkout")
      ? parseISO(params.get("checkout")!)
      : undefined;
    setDateRange(
      from && isValid(from)
        ? { from, to: to && isValid(to) ? to : undefined }
        : undefined
    );
    const count = (key: string, fallback: number, min: number) => {
      const value = Number(params.get(key));
      return params.has(key) && Number.isFinite(value)
        ? Math.max(min, Math.floor(value))
        : fallback;
    };
    setCounts({
      adults: count("adults", 2, 1),
      children: count("children", 0, 0),
      pets: count("pets", 0, 0),
    });
  }, [initialSearch]);

  const choices =
    destination.length >= 2 && suggestions.length
      ? suggestions
      : destinations.filter(
          d =>
            !destination ||
            d.label.toLowerCase().includes(destination.toLowerCase())
        );

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node))
        setDestinationOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    setActiveSuggestion(-1);
    if (destination.length < 2 || selected) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(destination)}&limit=5&lang=it`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error("Geocoder unavailable");
        const data = await response.json();
        if (!controller.signal.aborted)
          setSuggestions(
            (data.features ?? []).map(
              (feature: {
                properties: { name: string; state?: string; country?: string };
                geometry: { coordinates: [number, number] };
              }) => ({
                label: feature.properties.name,
                description: [
                  feature.properties.state,
                  feature.properties.country,
                ]
                  .filter(Boolean)
                  .join(", "),
                lng: feature.geometry.coordinates[0],
                lat: feature.geometry.coordinates[1],
              })
            )
          );
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [destination, selected]);

  function pick(choice: Destination) {
    setSelected(choice);
    setDestination(choice.label);
    setDestinationOpen(false);
  }

  function search(coords?: { lat: number; lng: number }) {
    const params = new URLSearchParams();
    if (new URLSearchParams(initialSearch).get("demo") === "1")
      params.set("demo", "1");
    if (destination.trim() && !coords) params.set("city", destination.trim());
    const location = coords ?? selected;
    if (location) {
      params.set("lat", String(location.lat));
      params.set("lng", String(location.lng));
    }
    if (dateRange?.from)
      params.set("checkin", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange?.to)
      params.set("checkout", format(dateRange.to, "yyyy-MM-dd"));
    Object.entries(counts).forEach(([key, value]) =>
      params.set(key, String(value))
    );
    navigate(`/search?${params}`);
  }

  function nearby() {
    if (!navigator.geolocation) {
      toast.error("La posizione non è disponibile in questo browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      p => search({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () =>
        toast.error(
          "Non riusciamo a trovare la tua posizione. Cerca una destinazione."
        ),
      { timeout: 10000 }
    );
  }

  return (
    <div className="stay-search" ref={wrapper}>
      <form
        className="stay-search-bar"
        onSubmit={event => {
          event.preventDefault();
          search();
        }}
        aria-label="Cerca una villa"
      >
        <div className="stay-destination-field">
          <MapPin size={19} aria-hidden="true" />
          <div>
            <label htmlFor="stay-destination">La tua destinazione</label>
            <input
              id="stay-destination"
              role="combobox"
              aria-expanded={destinationOpen}
              aria-controls="stay-destinations"
              aria-autocomplete="list"
              aria-activedescendant={
                destinationOpen && activeSuggestion >= 0
                  ? `stay-option-${activeSuggestion}`
                  : undefined
              }
              placeholder="Dove vuoi andare?"
              autoComplete="off"
              value={destination}
              onFocus={() => setDestinationOpen(true)}
              onChange={event => {
                setDestination(event.target.value);
                setSelected(null);
                setDestinationOpen(true);
              }}
              onKeyDown={event => {
                if (event.key === "Escape") setDestinationOpen(false);
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setDestinationOpen(true);
                  setActiveSuggestion(index =>
                    Math.min(index + 1, choices.length - 1)
                  );
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveSuggestion(index => Math.max(index - 1, 0));
                }
                if (
                  event.key === "Enter" &&
                  destinationOpen &&
                  activeSuggestion >= 0 &&
                  choices[activeSuggestion]
                ) {
                  event.preventDefault();
                  pick(choices[activeSuggestion]);
                }
              }}
            />
          </div>
          {destinationOpen && (
            <div
              className="stay-destinations"
              id="stay-destinations"
              role="listbox"
              aria-label="Destinazioni suggerite"
            >
              <p>
                {searching
                  ? "Cerchiamo la tua destinazione…"
                  : "Lasciati ispirare"}
              </p>
              {choices.map((choice, index) => (
                <button
                  key={`${choice.label}-${index}`}
                  id={`stay-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={activeSuggestion === index}
                  onClick={() => pick(choice)}
                >
                  <MapPin size={18} />
                  <span>
                    <strong>{choice.label}</strong>
                    <small>{choice.description}</small>
                  </span>
                </button>
              ))}
              {!searching && !choices.length && (
                <p>Premi Cerca per esplorare questa destinazione.</p>
              )}
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={nearby}
              >
                <Navigation size={18} />
                <span>
                  <strong>Vicino a me</strong>
                  <small>Usa la mia posizione</small>
                </span>
              </button>
            </div>
          )}
        </div>
        <Popover open={datesOpen} onOpenChange={setDatesOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="stay-search-field"
              onClick={() => setDestinationOpen(false)}
            >
              <CalendarDays size={19} />
              <span>
                <span className="stay-field-label">Quando parti?</span>
                <span className="stay-field-value">
                  {dateRange?.from
                    ? `${format(dateRange.from, "d MMM", { locale: it })}${dateRange.to ? ` — ${format(dateRange.to, "d MMM", { locale: it })}` : " — Scegli il ritorno"}`
                    : "Aggiungi le date"}
                </span>
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="stay-calendar-popover w-auto p-3"
            align="center"
          >
            <p className="px-3 pt-2 text-sm font-medium">
              {dateRange?.from && !dateRange.to
                ? "Quando torni?"
                : "Scegli il tuo soggiorno"}
            </p>
            <Calendar
              mode="range"
              selected={dateRange}
              numberOfMonths={2}
              locale={it}
              disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
              onDayClick={(day, modifiers) => {
                if (modifiers.disabled) return;
                if (!dateRange?.from || dateRange.to)
                  setDateRange({ from: day });
                else if (isSameDay(day, dateRange.from))
                  setDateRange(undefined);
                else {
                  setDateRange(
                    day < dateRange.from
                      ? { from: day, to: dateRange.from }
                      : { from: dateRange.from, to: day }
                  );
                  setDatesOpen(false);
                }
              }}
            />
            <button
              type="button"
              className="stay-clear-dates"
              onClick={() => setDateRange(undefined)}
            >
              Cancella date
            </button>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="stay-search-field"
              onClick={() => setDestinationOpen(false)}
            >
              <Users size={19} />
              <span>
                <span className="stay-field-label">In buona compagnia</span>
                <span className="stay-field-value">
                  {counts.adults + counts.children} ospiti
                  {counts.pets ? `, ${counts.pets} animali` : ""}
                </span>
              </span>
              <ChevronDown size={14} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-5" align="end">
            {(
              [
                ["adults", "Adulti", "Dai 13 anni"],
                ["children", "Bambini", "Fino a 12 anni"],
                ["pets", "Animali", "Da indicare nella ricerca"],
              ] as const
            ).map(([key, label, description]) => (
              <div className="stay-guest-row" key={key}>
                <span>
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
                <div>
                  <button
                    type="button"
                    aria-label={`Riduci ${label.toLowerCase()}`}
                    disabled={counts[key] <= (key === "adults" ? 1 : 0)}
                    onClick={() =>
                      setCounts(c => ({ ...c, [key]: c[key] - 1 }))
                    }
                  >
                    <Minus size={14} />
                  </button>
                  <span aria-live="polite">{counts[key]}</span>
                  <button
                    type="button"
                    aria-label={`Aumenta ${label.toLowerCase()}`}
                    onClick={() =>
                      setCounts(c => ({ ...c, [key]: c[key] + 1 }))
                    }
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </PopoverContent>
        </Popover>
        <button className="stay-search-submit" type="submit">
          <Search size={18} />
          <span>Cerca la tua villa</span>
        </button>
      </form>
    </div>
  );
}
