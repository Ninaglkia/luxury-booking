import { BRAND } from "@/lib/brand";
import { BRAND_WORDMARK_PATH } from "@/lib/brand-art";

export default function BrandWordmark({
  tagline = false,
}: {
  tagline?: boolean;
}) {
  return (
    <span className="stay-wordmark" role="img" aria-label={BRAND.name}>
      <svg
        className="stay-wordmark-art"
        viewBox="0 0 344 78"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d={BRAND_WORDMARK_PATH}
          stroke="currentColor"
          strokeWidth="6.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="206" cy="18" r="3.8" fill="currentColor" />
      </svg>
      {tagline && <small>{BRAND.tagline}</small>}
    </span>
  );
}
