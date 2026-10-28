import { BRAND } from "@/lib/brand";
import "@/styles/brand.css";

// The bnbvilla’s signature: one calligraphic word, the ’s always attached.
export default function BrandWordmark({
  tagline = false,
}: {
  tagline?: boolean;
}) {
  return (
    <span className="stay-wordmark" role="img" aria-label={BRAND.name}>
      <span className="stay-wordmark-script" aria-hidden="true">
        {BRAND.wordmark}
      </span>
      {tagline && <small>{BRAND.tagline}</small>}
    </span>
  );
}
