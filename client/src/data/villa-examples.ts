export type VillaListing = {
  id: string;
  isDemo: boolean;
  title: string;
  city: string;
  region: string;
  country: string;
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  area?: number;
  image?: string;
  coordinates: { lat: number; lng: number } | null;
  tags: string[];
  description: string;
};

// Fictional examples live only in the browser. Their string IDs are never sent
// to booking APIs; the detail dialog has no checkout or booking action.
export const DEMO_VILLAS: VillaListing[] = [
  {
    id: "example-pietra-marina",
    isDemo: true,
    title: "Villa Pietra Marina",
    city: "Amalfi",
    region: "Costiera Amalfitana",
    country: "Italia",
    pricePerNight: 680,
    maxGuests: 8,
    bedrooms: 4,
    bathrooms: 4,
    area: 280,
    image: "/images/stay-hero.jpg",
    coordinates: { lat: 40.635, lng: 14.602 },
    tags: ["Piscina privata", "Vista mare", "Terrazza"],
    description:
      "Pietra chiara, una terrazza aperta sul Mediterraneo e una piscina che incontra l’orizzonte. Un esempio di villa pensata per lunghe colazioni all’aperto e cene in compagnia, con quattro camere e spazi da vivere insieme.",
  },
  {
    id: "example-tenuta-ulivi",
    isDemo: true,
    title: "Tenuta degli Ulivi",
    city: "San Quirico d’Orcia",
    region: "Toscana · Val d’Orcia",
    country: "Italia",
    pricePerNight: 425,
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 3,
    area: 220,
    image: "/images/stay-country.jpg",
    coordinates: { lat: 43.058, lng: 11.602 },
    tags: ["Piscina privata", "Giardino", "Tra gli ulivi"],
    description:
      "Un casale tra cipressi e olivi, con un giardino raccolto e le colline toscane sullo sfondo. Tre camere, una piscina privata e una grande tavola all’ombra: un’idea di soggiorno per rallentare e ritrovarsi.",
  },
  {
    id: "example-dimora-vento",
    isDemo: true,
    title: "Dimora del Vento",
    city: "Porto Cervo",
    region: "Sardegna · Costa Smeralda",
    country: "Italia",
    pricePerNight: 540,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    area: 160,
    image: "/images/stay-island.jpg",
    coordinates: { lat: 41.118, lng: 9.529 },
    tags: ["Vista mare", "Terrazza", "Vicino alla spiaggia"],
    description:
      "Una terrazza in pietra sopra una cala azzurra, il profumo della macchia mediterranea e il mare a pochi passi. Un esempio di dimora raccolta per una coppia o una piccola famiglia, con due camere e spazi luminosi.",
  },
  {
    id: "example-masseria-luce",
    isDemo: true,
    title: "Masseria della Luce",
    city: "Ostuni",
    region: "Puglia · Valle d’Itria",
    country: "Italia",
    pricePerNight: 760,
    maxGuests: 10,
    bedrooms: 5,
    bathrooms: 5,
    area: 350,
    image: "/images/stay-puglia.jpg",
    coordinates: { lat: 40.723, lng: 17.576 },
    tags: ["Piscina privata", "Giardino", "Tra gli ulivi"],
    description:
      "Volte in pietra, pareti color crema e un uliveto tutto intorno. Una masseria d’esempio con cinque camere, una piscina lunga e corti ombreggiate, immaginata per riunire amici e famiglie sotto il sole pugliese.",
  },
];

export type PropertyRecord = {
  id: number;
  title: string;
  city: string;
  country: string;
  pricePerNight: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  latitude?: unknown;
  longitude?: unknown;
  description?: string;
  images?: { imageUrl: string }[];
};

export function propertyToListing(property: PropertyRecord): VillaListing {
  const lat =
    property.latitude == null || property.latitude === ""
      ? NaN
      : Number(property.latitude);
  const lng =
    property.longitude == null || property.longitude === ""
      ? NaN
      : Number(property.longitude);
  return {
    id: String(property.id),
    isDemo: false,
    title: property.title,
    city: property.city,
    region: property.country,
    country: property.country,
    pricePerNight: property.pricePerNight,
    maxGuests: property.maxGuests,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    image: property.images?.[0]?.imageUrl,
    coordinates:
      Number.isFinite(lat) &&
      Math.abs(lat) <= 90 &&
      Number.isFinite(lng) &&
      Math.abs(lng) <= 180
        ? { lat, lng }
        : null,
    tags: [],
    description:
      property.description ??
      "Scopri tutti i dettagli della villa e organizza il tuo prossimo soggiorno.",
  };
}

export const villaPrice = (price: number) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
