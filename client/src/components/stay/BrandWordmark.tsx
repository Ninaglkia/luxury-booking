import { BRAND } from "@/lib/brand";

export default function BrandWordmark({
  tagline = true,
}: {
  tagline?: boolean;
}) {
  return (
    <span className="stay-wordmark">
      {BRAND.wordmarkLead}{" "}
      <span className="stay-brand-italic">{BRAND.wordmarkTail}</span>
      {tagline && <small>{BRAND.tagline}</small>}
    </span>
  );
}
