import { BRAND } from "@/lib/brand";

export default function BrandWordmark({
  tagline = true,
}: {
  tagline?: boolean;
}) {
  return (
    <span className="stay-wordmark">
      <span className="stay-wordmark-line">
        <span className="stay-wordmark-lead">{BRAND.wordmarkLead}</span>
        <span className="stay-wordmark-name">{BRAND.wordmarkTail}</span>
      </span>
      {tagline && <small>{BRAND.tagline}</small>}
    </span>
  );
}
