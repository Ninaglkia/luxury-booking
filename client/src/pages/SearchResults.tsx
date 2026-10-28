import { useCallback, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  ArrowLeft,
  ArrowUpRight,
  House,
  List,
  Map as MapIcon,
  MapPin,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  DEMO_VILLAS,
  propertyToListing,
  villaPrice,
  type PropertyRecord,
  type VillaListing,
} from "@/data/villa-examples";
import StaySearch from "@/components/stay/StaySearch";
import StayMap, { type MapBounds } from "@/components/stay/StayMap";
import VillaCard from "@/components/stay/VillaCard";
import VillaExampleDialog from "@/components/stay/VillaExampleDialog";
import "@/styles/stay.css";
import "@/styles/stay-map.css";

const normalized = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function VillaExplorer({ mapFirst = false }: { mapFirst?: boolean }) {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const forceDemo = params.get("demo") === "1";
  const city = params.get("city") ?? "";
  const guests = Math.max(
    1,
    Number(params.get("adults") || 2) + Number(params.get("children") || 0)
  );
  const { data: properties, isError } = trpc.properties.list.useQuery(
    undefined,
    { retry: 1, enabled: !forceDemo }
  );
  const isDemo = forceDemo || !properties?.length;
  const source = useMemo(
    () =>
      isDemo
        ? DEMO_VILLAS
        : (properties ?? []).map(property =>
            propertyToListing(property as PropertyRecord)
          ),
    [isDemo, properties]
  );
  const [editSearch, setEditSearch] = useState(false);
  const [view, setView] = useState<"list" | "map">(mapFirst ? "map" : "list");
  const [sort, setSort] = useState("recommended");
  const [filterOpen, setFilterOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(0);
  const [minBedrooms, setMinBedrooms] = useState(0);
  const [withinMap, setWithinMap] = useState(false);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [opened, setOpened] = useState<VillaListing | null>(null);

  const filtered = useMemo(() => {
    const term = normalized(city.trim());
    const lat = params.get("lat") ? Number(params.get("lat")) : NaN;
    const lng = params.get("lng") ? Number(params.get("lng")) : NaN;
    return source
      .filter(villa => {
        if (
          villa.maxGuests < guests ||
          (maxPrice > 0 && villa.pricePerNight > maxPrice) ||
          villa.bedrooms < minBedrooms
        )
          return false;
        if (!term) return true;
        const textMatch = normalized(
          `${villa.title} ${villa.city} ${villa.region} ${villa.country}`
        ).includes(term);
        const nearDestination =
          Number.isFinite(lat) &&
          Number.isFinite(lng) &&
          villa.coordinates &&
          Math.abs(villa.coordinates.lat - lat) < 0.9 &&
          Math.abs(villa.coordinates.lng - lng) < 1.2;
        return textMatch || nearDestination;
      })
      .sort((a, b) =>
        sort === "price"
          ? a.pricePerNight - b.pricePerNight
          : sort === "space"
            ? b.maxGuests - a.maxGuests
            : 0
      );
  }, [source, city, guests, maxPrice, minBedrooms, sort, params]);
  const visible = useMemo(
    () =>
      withinMap && bounds
        ? filtered.filter(
            villa =>
              !villa.coordinates ||
              (villa.coordinates.lat >= bounds.south &&
                villa.coordinates.lat <= bounds.north &&
                villa.coordinates.lng >= bounds.west &&
                villa.coordinates.lng <= bounds.east)
          )
        : filtered,
    [filtered, withinMap, bounds]
  );
  const active = filtered.find(villa => villa.id === selectedId) ?? null;
  const handleBounds = useCallback((next: MapBounds) => setBounds(next), []);

  function showDetails(villa: VillaListing) {
    setSelectedId(villa.id);
    if (villa.isDemo) setOpened(villa);
    else navigate(`/properties/${encodeURIComponent(villa.id)}`);
  }

  function resetFilters() {
    setMaxPrice(0);
    setMinBedrooms(0);
    setWithinMap(false);
  }

  return (
    <div className="stay-page stay-explore-page">
      <header className="stay-explore-header">
        <Link href="/" className="stay-brand">
          <span className="stay-brand-mark">
            <House size={21} strokeWidth={1.3} />
          </span>
          <span>
            Luxury<span className="stay-brand-italic">Stay</span>
            <small>EXCEPTIONAL PLACES. YOUR WAY.</small>
          </span>
        </Link>
        <Link href="/" className="stay-explore-back">
          <ArrowLeft size={14} />
          Torna a esplorare
        </Link>
        <Link href="/become-host" className="stay-account">
          Hai una villa? <ArrowUpRight size={14} />
        </Link>
      </header>
      <div className={`stay-explore-search ${editSearch ? "is-expanded" : ""}`}>
        <StaySearch initialSearch={search} />
        <button
          type="button"
          className="stay-mobile-search-edit"
          aria-expanded={editSearch}
          onClick={() => setEditSearch(!editSearch)}
        >
          <span>
            {guests} ospiti ·{" "}
            {params.get("checkin") ? "Date selezionate" : "Date flessibili"}
          </span>
          <span>{editSearch ? "Chiudi" : "Modifica date e ospiti"}</span>
        </button>
      </div>
      <div className="stay-explore-toolbar">
        <div>
          <p className="stay-eyebrow">
            {isDemo ? "LA COLLEZIONE D’ESEMPIO" : "LA COLLEZIONE"}
          </p>
          <h1>
            {city ? (
              <>
                Il tuo soggiorno a <em>{city}.</em>
              </>
            ) : (
              <>
                Un bel posto, <em>da trovare.</em>
              </>
            )}
          </h1>
        </div>
        <div className="stay-explore-controls">
          <label className="stay-sort">
            <span className="sr-only">Ordina le ville</span>
            <select
              value={sort}
              onChange={event => setSort(event.target.value)}
            >
              <option value="recommended">La nostra selezione</option>
              <option value="price">Prezzo crescente</option>
              <option value="space">Più spazio e ospiti</option>
            </select>
          </label>
          <button
            type="button"
            className={`stay-filter-toggle ${filterOpen ? "is-open" : ""}`}
            aria-expanded={filterOpen}
            aria-controls="stay-explore-filters"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <SlidersHorizontal size={15} />
            Filtri{(maxPrice > 0 || minBedrooms > 0) && <span>•</span>}
          </button>
        </div>
      </div>
      {filterOpen && (
        <div className="stay-explore-filters" id="stay-explore-filters">
          <label>
            Prezzo massimo a notte
            <select
              value={maxPrice}
              onChange={event => setMaxPrice(Number(event.target.value))}
            >
              <option value={0}>Qualsiasi prezzo</option>
              <option value={450}>Fino a € 450</option>
              <option value={600}>Fino a € 600</option>
              <option value={800}>Fino a € 800</option>
            </select>
          </label>
          <label>
            Camere da letto
            <select
              value={minBedrooms}
              onChange={event => setMinBedrooms(Number(event.target.value))}
            >
              <option value={0}>Qualsiasi numero</option>
              <option value={2}>Almeno 2</option>
              <option value={3}>Almeno 3</option>
              <option value={4}>Almeno 4</option>
              <option value={5}>Almeno 5</option>
            </select>
          </label>
          <button type="button" onClick={resetFilters}>
            Azzera i filtri
          </button>
          <button
            type="button"
            aria-label="Chiudi i filtri"
            onClick={() => setFilterOpen(false)}
          >
            <X size={17} />
          </button>
        </div>
      )}
      <div className="stay-explore-info">
        <span>
          <strong>{visible.length}</strong>{" "}
          {visible.length === 1 ? "villa" : "ville"}
          {isDemo && " d’esempio"} · {guests} ospiti
        </span>
        {isDemo ? (
          <span className="stay-explore-demo-note">
            Esempi illustrativi, non prenotabili
          </span>
        ) : (
          <label>
            <input
              type="checkbox"
              checked={withinMap}
              onChange={event => setWithinMap(event.target.checked)}
            />
            Cerca mentre sposti la mappa
          </label>
        )}
      </div>
      <main className={`stay-explore-main stay-view-${view}`}>
        <section
          className="stay-explore-list"
          aria-label="Ville nella selezione"
        >
          <div className="stay-explore-card-grid">
            {visible.length ? (
              visible.map(villa => (
                <VillaCard
                  key={villa.id}
                  villa={villa}
                  onSelect={showDetails}
                  onHover={setHovered}
                  selected={selectedId === villa.id}
                  compact
                />
              ))
            ) : (
              <div className="stay-explore-empty">
                <MapPin size={31} strokeWidth={1.2} />
                <h2>
                  Un po’ più in là,
                  <br />
                  <em>il posto giusto.</em>
                </h2>
                <p>
                  Non ci sono {isDemo ? "esempi" : "ville"} con questa
                  selezione. Prova un’altra destinazione o amplia i filtri.
                </p>
                <button
                  type="button"
                  className="stay-text-link"
                  onClick={() => {
                    resetFilters();
                    navigate(isDemo ? "/search?demo=1" : "/search");
                  }}
                >
                  Mostra tutte le ville <ArrowUpRight size={16} />
                </button>
              </div>
            )}
          </div>
          {isDemo && (
            <p className="stay-explore-disclaimer">
              Annunci dimostrativi. Le ville, le foto, le posizioni e i prezzi
              sono illustrativi e non rappresentano offerte di soggiorno.
              {!forceDemo && isError
                ? " Il catalogo reale non è al momento disponibile."
                : ""}
            </p>
          )}
        </section>
        <section
          className="stay-explore-map"
          aria-label="Esplora le ville sulla cartina"
        >
          <StayMap
            villas={filtered}
            activeId={hovered ?? selectedId}
            onSelect={villa => setSelectedId(villa.id)}
            onHover={setHovered}
            onBoundsChange={handleBounds}
          />
          {active && (
            <div className="stay-selected-map-villa">
              <button
                type="button"
                className="stay-map-preview-card"
                onClick={() => showDetails(active)}
              >
                {active.image && <img src={active.image} alt="" />}
                <div>
                  <span>
                    {active.isDemo ? "ESEMPIO · " : ""}
                    {active.city}
                  </span>
                  <h3>{active.title}</h3>
                  <p>
                    <strong>{villaPrice(active.pricePerNight)}</strong> / notte
                  </p>
                </div>
                <ArrowUpRight size={20} />
              </button>
              <button
                type="button"
                className="stay-map-preview-close"
                aria-label="Chiudi anteprima villa"
                onClick={() => setSelectedId(null)}
              >
                <X size={13} />
              </button>
            </div>
          )}
        </section>
      </main>
      <div className="stay-mobile-map-toggle">
        <button
          type="button"
          onClick={() => setView(view === "map" ? "list" : "map")}
        >
          {view === "map" ? <List size={16} /> : <MapIcon size={16} />}
          {view === "map" ? "Mostra l’elenco" : "Esplora la mappa"}
        </button>
      </div>
      <VillaExampleDialog villa={opened} onClose={() => setOpened(null)} />
    </div>
  );
}

export default function SearchResults() {
  return <VillaExplorer />;
}
