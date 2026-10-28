import BrandMark from "@/components/stay/BrandMark";
import BrandWordmark from "@/components/stay/BrandWordmark";
import { BRAND } from "@/lib/brand";
import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  House,
  MapPin,
  Menu,
  MessageCircle,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import StaySearch from "@/components/stay/StaySearch";
import VillaCard from "@/components/stay/VillaCard";
import VillaExampleDialog from "@/components/stay/VillaExampleDialog";
import MapDiscovery from "@/components/stay/MapDiscovery";
import { DEMO_VILLAS, type VillaListing } from "@/data/villa-examples";
import "@/styles/stay.css";

const destinations = [
  {
    name: "La costa",
    detail: "Il mare come orizzonte",
    query: "Amalfi",
    image: "/images/stay-hero.jpg",
    position: "center",
  },
  {
    name: "La campagna",
    detail: "Il lusso di rallentare",
    query: "Toscana",
    image: "/images/stay-country.jpg",
    position: "center",
  },
  {
    name: "Le isole",
    detail: "Un mondo tutto tuo",
    query: "Sardegna",
    image: "/images/stay-island.jpg",
    position: "center",
  },
];
const filters = [
  "Tutte le ville",
  "Per due",
  "In famiglia",
  "Insieme, in grande",
] as const;
type Filter = (typeof filters)[number];

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("Tutte le ville");
  const { data: properties } = trpc.properties.list.useQuery(undefined, {
    retry: 1,
  });
  const [selectedExample, setSelectedExample] = useState<VillaListing | null>(
    null
  );
  const examples = DEMO_VILLAS.filter(villa =>
    filter === "Per due"
      ? villa.maxGuests <= 4
      : filter === "In famiglia"
        ? villa.maxGuests >= 4
        : filter === "Insieme, in grande"
          ? villa.maxGuests >= 8
          : true
  );
  const featured = (properties ?? [])
    .filter(property =>
      filter === "Per due"
        ? property.maxGuests <= 4
        : filter === "In famiglia"
          ? property.maxGuests >= 4
          : filter === "Insieme, in grande"
            ? property.maxGuests >= 8
            : true
    )
    .slice(0, 4);

  return (
    <div className="stay-page">
      <a className="stay-skip" href="#main-content">
        Vai al contenuto
      </a>
      <header className="stay-header">
        <Link
          href="/"
          className="stay-brand"
          aria-label={`${BRAND.name}, pagina iniziale`}
        >
          <BrandMark />
          <BrandWordmark />
        </Link>
        <nav className="stay-desktop-nav" aria-label="Navigazione principale">
          <a href="#collection">Le nostre ville</a>
          <a href="#destinations">Destinazioni</a>
          <a href="#map-discovery">La mappa</a>
          <a href="#our-way">Il nostro mondo</a>
        </nav>
        <div className="stay-header-actions">
          <Link href="/become-host" className="stay-host-link">
            Hai una villa?
          </Link>
          <Link
            href={isAuthenticated ? "/dashboard" : "/login"}
            className="stay-account"
          >
            {isAuthenticated
              ? user?.name?.split(" ")[0] || "Il tuo account"
              : "Accedi"}
            <ArrowUpRight size={15} />
          </Link>
          <button
            type="button"
            className="stay-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Chiudi il menu" : "Apri il menu"}
            aria-expanded={menuOpen}
            aria-controls="stay-mobile-menu"
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
        {menuOpen && (
          <nav
            id="stay-mobile-menu"
            className="stay-mobile-nav"
            aria-label="Menu mobile"
          >
            <a href="#collection" onClick={() => setMenuOpen(false)}>
              Le nostre ville
            </a>
            <a href="#destinations" onClick={() => setMenuOpen(false)}>
              Destinazioni
            </a>
            <a href="#our-way" onClick={() => setMenuOpen(false)}>
              Il nostro mondo
            </a>
            <Link href="/become-host">Hai una villa?</Link>
            {isAuthenticated && (
              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false);
                  await logout();
                }}
              >
                Esci dall'account
              </button>
            )}
          </nav>
        )}
      </header>

      <main id="main-content">
        <section className="stay-hero" aria-labelledby="stay-title">
          <img
            className="stay-hero-image"
            src="/images/stay-hero.jpg"
            alt="Una villa mediterranea in pietra affacciata su una piscina e sul mare"
            fetchPriority="high"
            width="1536"
            height="1024"
          />
          <div className="stay-hero-shade" />
          <div className="stay-hero-content">
            <p className="stay-eyebrow">
              <span /> LUOGHI SPECIALI, MOMENTI TUOI
            </p>
            <h1 id="stay-title">
              Ci sono luoghi.
              <br />E poi c’è <em>il tuo.</em>
            </h1>
            <p>
              Ville da vivere, tempo da ritrovare.
              <br />
              Il tuo prossimo ricordo comincia qui.
            </p>
            <a href="#collection" className="stay-hero-link">
              Trova il tuo posto nel mondo <ArrowUpRight size={19} />
            </a>
          </div>
          <div className="stay-hero-bottom">
            <span>IL PIACERE DI SENTIRSI ALTROVE.</span>
            <a href="#destinations" aria-label="Scopri le destinazioni">
              <ArrowDown size={19} />
            </a>
            <span>LA TUA PROSSIMA PAUSA, SENZA FRETTA.</span>
          </div>
        </section>
        <div className="stay-search-container">
          <StaySearch />
        </div>

        <div className="stay-intro">
          <span>Una casa tutta tua.</span>
          <span>Una prospettiva diversa.</span>
          <span>Il tempo che meriti.</span>
        </div>

        <section
          id="collection"
          className="stay-section stay-collection"
          aria-labelledby="collection-title"
        >
          <div className="stay-section-top">
            <div>
              <p className="stay-eyebrow">LA COLLEZIONE</p>
              <h2 id="collection-title">
                Il bello di <em>essere altrove.</em>
              </h2>
            </div>
            <Link href="/search" className="stay-text-link">
              Esplora tutte le ville <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="stay-collection-toolbar">
            <p>Spazi da condividere. Luoghi da ricordare.</p>
            <div
              className="stay-filters"
              role="group"
              aria-label="Filtra le ville per ospiti"
            >
              {filters.map(item => (
                <button
                  type="button"
                  key={item}
                  aria-pressed={filter === item}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          {!properties?.length ? (
            <>
              <p className="stay-demo-notice">
                <span>Una prima ispirazione</span> Annunci e prezzi d’esempio,
                non prenotabili.
              </p>
              <div className="stay-villa-grid">
                {examples.map(villa => (
                  <VillaCard
                    key={villa.id}
                    villa={villa}
                    onSelect={setSelectedExample}
                  />
                ))}
              </div>
            </>
          ) : featured.length ? (
            <div className="stay-villa-grid">
              {featured.map(property => {
                const image = (
                  property as typeof property & {
                    images?: { imageUrl: string }[];
                  }
                ).images?.[0]?.imageUrl;
                return (
                  <Link
                    key={property.id}
                    href={`/properties/${property.id}`}
                    className="stay-villa"
                  >
                    <div className="stay-villa-image">
                      {image ? (
                        <img
                          src={image}
                          alt={property.title}
                          loading="lazy"
                          width="700"
                          height="800"
                        />
                      ) : (
                        <div className="stay-no-photo">
                          <House size={40} strokeWidth={1} />
                          <span>Fotografie in arrivo</span>
                        </div>
                      )}
                      <span className="stay-villa-location">
                        <MapPin size={12} />
                        {property.city}, {property.country}
                      </span>
                      <span className="stay-villa-arrow">
                        <ArrowUpRight size={20} />
                      </span>
                    </div>
                    <div className="stay-villa-info">
                      <h3>{property.title}</h3>
                      <span>
                        <strong>
                          €{" "}
                          {Number(property.pricePerNight).toLocaleString(
                            "it-IT"
                          )}
                        </strong>{" "}
                        / notte
                      </span>
                    </div>
                    <p className="stay-villa-details">
                      <span>
                        <Users size={14} />
                        {property.maxGuests} ospiti
                      </span>
                      <span>
                        <BedDouble size={14} />
                        {property.bedrooms} camere
                      </span>
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="stay-empty">
              <House size={30} strokeWidth={1.2} />
              <h3>
                {properties?.length
                  ? "Un altro modo di stare insieme."
                  : "Il tuo prossimo luogo speciale è in arrivo."}
              </h3>
              <p>
                {properties?.length
                  ? "Prova un'altra selezione per trovare la villa che fa per te."
                  : "Stiamo preparando la collezione. Nel frattempo, lasciati ispirare dalle nostre destinazioni."}
              </p>
              {properties?.length ? (
                <button
                  type="button"
                  className="stay-text-link"
                  onClick={() => setFilter("Tutte le ville")}
                >
                  Mostra tutte le ville <ArrowRight size={16} />
                </button>
              ) : (
                <Link href="/become-host" className="stay-text-link">
                  Hai una villa? Entra nella collezione <ArrowRight size={16} />
                </Link>
              )}
            </div>
          )}
        </section>

        <MapDiscovery />

        <section
          id="destinations"
          className="stay-section stay-destinations-section"
          aria-labelledby="destinations-title"
        >
          <div className="stay-section-top">
            <div>
              <p className="stay-eyebrow">SEGUI LA TUA VOGLIA DI PARTIRE</p>
              <h2 id="destinations-title">
                A ognuno, <em>il suo altrove.</em>
              </h2>
            </div>
            <p className="stay-section-description">
              Sale sulla pelle, silenzi tra gli ulivi,
              <br />
              un’isola lontana dal quotidiano.
            </p>
          </div>
          <div className="stay-destination-grid">
            {destinations.map((destination, index) => (
              <Link
                className="stay-destination-card"
                href={`/search?city=${encodeURIComponent(destination.query)}`}
                key={destination.name}
              >
                <img
                  src={destination.image}
                  alt={destination.detail}
                  loading="lazy"
                  width="900"
                  height="1000"
                  style={{ objectPosition: destination.position }}
                />
                <span className="stay-destination-number">
                  0{index + 1} / ISPIRAZIONI
                </span>
                <div>
                  <p>{destination.detail}</p>
                  <h3>{destination.name}</h3>
                </div>
                <span className="stay-destination-arrow">
                  <ArrowUpRight size={24} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section id="our-way" className="stay-philosophy">
          <div className="stay-philosophy-image">
            <img
              src="/images/stay-country.jpg"
              alt="La quiete di un giardino mediterraneo"
              loading="lazy"
              width="900"
              height="1000"
            />
            <span>
              LESS EVERYDAY.
              <br />
              MORE EXTRAORDINARY.
            </span>
          </div>
          <div className="stay-philosophy-copy">
            <p className="stay-eyebrow">IL MONDO {BRAND.name.toUpperCase()}</p>
            <h2>
              Non solo una villa.
              <br />
              <em>Un altro ritmo.</em>
            </h2>
            <p>
              La prima colazione senza guardare l’ora. Un tuffo prima che il
              mondo si svegli. Una tavola lunga, con le persone giuste.
            </p>
            <p>
              Crediamo nei luoghi che ti fanno stare bene. E nella libertà di
              viverli a modo tuo.
            </p>
            <Link href="/search" className="stay-text-link">
              Trova il tuo prossimo soggiorno <ArrowUpRight size={18} />
            </Link>
            <div className="stay-service-note">
              <MessageCircle size={22} strokeWidth={1.3} />
              <div>
                <strong>Prima di partire, parliamone.</strong>
                <span>
                  Scrivi al proprietario e organizza i dettagli del soggiorno.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="stay-host-banner">
          <div>
            <p className="stay-eyebrow">PER CHI HA UN LUOGO SPECIALE</p>
            <h2>
              La tua villa. <em>La loro prossima storia.</em>
            </h2>
          </div>
          <Link href="/become-host" className="stay-outline-link">
            Entra nella collezione <ArrowUpRight size={18} />
          </Link>
        </section>
      </main>
      <VillaExampleDialog
        villa={selectedExample}
        onClose={() => setSelectedExample(null)}
      />
      <footer className="stay-footer">
        <div className="stay-footer-main">
          <div>
            <Link
              href="/"
              className="stay-footer-brand"
              aria-label={`${BRAND.name}, pagina iniziale`}
            >
              <BrandMark />
              <BrandWordmark tagline={false} />
            </Link>
            <p>Luoghi speciali. Il tuo modo di viverli.</p>
          </div>
          <div className="stay-footer-links">
            <div>
              <p>ESPLORA</p>
              <Link href="/search">Le nostre ville</Link>
              <a href="#destinations">Destinazioni</a>
              <a href="#map-discovery">La mappa</a>
              <Link href="/properties-map">Esplora la mappa</Link>
            </div>
            <div>
              <p>IL TUO SOGGIORNO</p>
              <Link href="/dashboard">Le tue prenotazioni</Link>
              <Link href="/messages">Messaggi</Link>
              <Link href="/profile">Il tuo profilo</Link>
            </div>
            <div>
              <p>PER I PROPRIETARI</p>
              <Link href="/become-host">Entra nella collezione</Link>
              <Link href="/host/dashboard">Area proprietari</Link>
            </div>
          </div>
        </div>
        <div className="stay-footer-bottom">
          <span>
            © {new Date().getFullYear()} {BRAND.name}
          </span>
          <span>Fatto per chi ama i bei posti.</span>
          <a href="#main-content">
            Torna su <ArrowUpRight size={14} />
          </a>
        </div>
      </footer>
    </div>
  );
}
