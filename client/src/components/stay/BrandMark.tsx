import { BRAND_B_PATH } from "@/lib/brand-art";

// The compact icon is taken directly from the wordmark's first letter.
// Use for favicons/avatars; the primary signature is BrandWordmark alone.
export default function BrandMark({
  tone = "olive",
}: {
  tone?: "olive" | "light";
}) {
  const paper = "#f8f5e9";
  const olive = "#4c583e";
  return (
    <svg
      className="stay-brand-emblem"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        width="80"
        height="80"
        rx="19"
        fill={tone === "light" ? paper : olive}
      />
      <path
        d={BRAND_B_PATH}
        transform="translate(16 0)"
        stroke={tone === "light" ? olive : paper}
        strokeWidth="6.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
