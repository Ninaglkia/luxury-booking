import { ArrowUpRight, BedDouble, House, MapPin, Users } from "lucide-react";
import { villaPrice, type VillaListing } from "@/data/villa-examples";

export default function VillaCard({
  villa,
  onSelect,
  onHover,
  selected = false,
  compact = false,
}: {
  villa: VillaListing;
  onSelect: (villa: VillaListing) => void;
  onHover?: (id: string | null) => void;
  selected?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      className={`stay-villa stay-example-card ${compact ? "stay-villa-compact" : ""} ${selected ? "is-selected" : ""}`}
      onClick={() => onSelect(villa)}
      onMouseEnter={() => onHover?.(villa.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(villa.id)}
      onBlur={() => onHover?.(null)}
      aria-label={`${villa.isDemo ? "Esempio: " : ""}${villa.title}, ${villa.city}, ${villaPrice(villa.pricePerNight)} a notte`}
    >
      <div className="stay-villa-image">
        {villa.image ? (
          <img
            src={villa.image}
            alt={
              villa.isDemo
                ? `Immagine illustrativa: ${villa.title}`
                : villa.title
            }
            loading="lazy"
            width="700"
            height="800"
          />
        ) : (
          <div className="stay-no-photo">
            <House size={36} strokeWidth={1} />
            <span>Fotografie in arrivo</span>
          </div>
        )}
        {villa.isDemo && <span className="stay-demo-badge">Esempio</span>}
        <span className="stay-villa-location">
          <MapPin size={12} />
          {villa.city}
        </span>
        <span className="stay-villa-arrow">
          <ArrowUpRight size={19} />
        </span>
      </div>
      <div className="stay-villa-text">
        <p className="stay-card-region">{villa.region}</p>
        <div className="stay-villa-info">
          <h3>{villa.title}</h3>
        </div>
        <p className="stay-villa-details">
          <span>
            <Users size={13} />
            {villa.maxGuests} ospiti
          </span>
          <span>
            <BedDouble size={13} />
            {villa.bedrooms} camere
          </span>
        </p>
        <div className="stay-villa-price">
          <span>
            <strong>{villaPrice(villa.pricePerNight)}</strong> / notte
          </span>
          <span>
            {villa.isDemo ? "Prezzo illustrativo" : "Scopri la villa"}
          </span>
        </div>
      </div>
    </button>
  );
}
