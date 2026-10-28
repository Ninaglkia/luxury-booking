import { useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, MapPin } from "lucide-react";
import {
  DEMO_VILLAS,
  villaPrice,
  type VillaListing,
} from "@/data/villa-examples";
import StayMap from "./StayMap";
import VillaExampleDialog from "./VillaExampleDialog";

export default function MapDiscovery() {
  const [active, setActive] = useState<VillaListing>(DEMO_VILLAS[0]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [opened, setOpened] = useState<VillaListing | null>(null);
  return (
    <section
      id="map-discovery"
      className="stay-map-discovery"
      aria-labelledby="discover-map-title"
    >
      <div className="stay-map-discovery-copy">
        <p className="stay-eyebrow">SCEGLI UN PUNTO. INIZIA UNA STORIA.</p>
        <h2 id="discover-map-title">
          Il tuo altrove,
          <br />
          <em>sulla mappa.</em>
        </h2>
        <p>
          Una cala nascosta, un borgo tra gli ulivi, la tua prossima vista
          preferita. Esplora gli esempi e trova l’atmosfera che cerchi.
        </p>
        <div className="stay-map-places">
          {DEMO_VILLAS.map(villa => (
            <button
              type="button"
              key={villa.id}
              aria-pressed={active.id === villa.id}
              onClick={() => setActive(villa)}
            >
              <MapPin size={13} />
              {villa.city}
            </button>
          ))}
        </div>
        <Link href="/search?demo=1" className="stay-text-link">
          Apri la mappa completa <ArrowUpRight size={18} />
        </Link>
        <small>Annunci dimostrativi · posizioni indicative</small>
      </div>
      <div className="stay-discovery-map">
        <StayMap
          villas={DEMO_VILLAS}
          activeId={hovered ?? active.id}
          onSelect={setActive}
          onHover={setHovered}
          embedded
        />
        <button
          type="button"
          className="stay-map-preview-card"
          onClick={() => setOpened(active)}
          aria-label={`Vedi l’esempio ${active.title}`}
        >
          <img src={active.image} alt="" />
          <div>
            <span>ESEMPIO · {active.city}</span>
            <h3>{active.title}</h3>
            <p>
              <strong>{villaPrice(active.pricePerNight)}</strong> / notte
            </p>
          </div>
          <ArrowUpRight size={20} />
        </button>
      </div>
      <VillaExampleDialog villa={opened} onClose={() => setOpened(null)} />
    </section>
  );
}
