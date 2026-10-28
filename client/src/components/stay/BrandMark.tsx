export default function BrandMark({
  tone = "olive",
}: {
  tone?: "olive" | "light";
}) {
  const paper = "#f8f5e9";
  const olive = "#4c583e";
  const background = tone === "light" ? paper : olive;
  const ink = tone === "light" ? olive : paper;

  return (
    <svg
      className="stay-brand-emblem"
      viewBox="0 0 72 80"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 74V34C6 17 19 5 36 5s30 12 30 29v40H6Z" fill={background} />
      <path
        d="M12 68V34c0-14 10-23 24-23s24 9 24 23v34H12Z"
        stroke={ink}
        strokeOpacity=".38"
        strokeWidth=".8"
      />
      <path
        d="M22 28v28m0-28h9c11 0 11 13 0 13h-9m0 0h10c12 0 12 15 0 15H22"
        stroke={ink}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m36 29 9 27 10-27"
        stroke={ink}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 28h6m7 0h7m12 0h7M18 56h8m15 0h8"
        stroke={ink}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <circle cx="36" cy="19" r="1.6" fill={ink} />
      <path d="M28 64h16" stroke={ink} strokeWidth=".8" strokeOpacity=".65" />
    </svg>
  );
}
