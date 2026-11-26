// Wall decorations: small local SVG motifs that drift over a wall
// (hearts, stars, flowers...). Never emoji, never external images.
// The layer is fixed and pointer-events-none, rendered first so the
// page content — which is positioned — sits above it. The motifs are
// faint (opacity 0.32) and few (two per enabled type, at most eight),
// so they decorate without cluttering. Reduced motion stops the drift.
import type { CSSProperties, ReactNode } from "react";
import type { Decoration } from "@/lib/themes";

const MOTIFS: Record<Decoration, ReactNode> = {
  hearts: (
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  ),
  stars: <path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2-6.3-4.5-6.3 4.5L8 13.8 2 9.2h7.6L12 2z" />,
  flowers: (
    <g>
      <circle cx="12" cy="5.5" r="3.6" />
      <circle cx="18.6" cy="10.2" r="3.6" />
      <circle cx="16.1" cy="17.8" r="3.6" />
      <circle cx="7.9" cy="17.8" r="3.6" />
      <circle cx="5.4" cy="10.2" r="3.6" />
      <circle cx="12" cy="12" r="3" />
    </g>
  ),
  clouds: (
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
  ),
  sparkles: <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />,
  butterflies: (
    <g>
      <ellipse cx="7.5" cy="8" rx="4" ry="5.5" transform="rotate(-25 7.5 8)" />
      <ellipse cx="16.5" cy="8" rx="4" ry="5.5" transform="rotate(25 16.5 8)" />
      <ellipse cx="8" cy="16.5" rx="3" ry="4" transform="rotate(-15 8 16.5)" />
      <ellipse cx="16" cy="16.5" rx="3" ry="4" transform="rotate(15 16 16.5)" />
      <rect x="11" y="7" width="2" height="11" rx="1" />
    </g>
  ),
  bows: (
    <g>
      <path d="M11 12L2 5v14l9-7z" />
      <path d="M13 12l9-7v14l-9-7z" />
      <circle cx="12" cy="12" r="2.5" />
    </g>
  ),
  daisies: (
    <g>
      <circle cx="12" cy="4.5" r="2.8" />
      <circle cx="18.5" cy="8" r="2.8" />
      <circle cx="18.5" cy="15" r="2.8" />
      <circle cx="12" cy="18.5" r="2.8" />
      <circle cx="5.5" cy="15" r="2.8" />
      <circle cx="5.5" cy="8" r="2.8" />
      <circle cx="12" cy="11.5" r="2.6" />
    </g>
  ),
};

// Motifs hug the edges so they never sit on the hero text or the
// fragment form. Positions are fixed, so the wall looks the same on
// every visit instead of jumping around.
const SPOTS: { left: string; top: string; size: number; rot: number; delay: number }[] = [
  { left: "3%", top: "14%", size: 32, rot: -12, delay: 0 },
  { left: "90%", top: "10%", size: 26, rot: 14, delay: 1.2 },
  { left: "88%", top: "45%", size: 30, rot: 8, delay: 2.1 },
  { left: "4%", top: "58%", size: 24, rot: -18, delay: 0.6 },
  { left: "92%", top: "72%", size: 32, rot: 20, delay: 1.8 },
  { left: "6%", top: "86%", size: 28, rot: 10, delay: 2.6 },
  { left: "85%", top: "90%", size: 24, rot: -8, delay: 0.9 },
  { left: "45%", top: "4%", size: 22, rot: 16, delay: 1.5 },
];

export function WallDecorations({ decorations }: { decorations: Decoration[] }) {
  if (decorations.length === 0) return null;
  const items = decorations.flatMap((motif, i) =>
    [0, 1].map((k) => ({
      motif,
      spot: SPOTS[(i * 2 + k) % SPOTS.length],
    })),
  );
  return (
    <div className="wall-decorations" aria-hidden>
      {items.map((item, i) => (
        <svg
          key={`${item.motif}-${i}`}
          className="decor"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={
            {
              left: item.spot.left,
              top: item.spot.top,
              width: item.spot.size,
              height: item.spot.size,
              "--decor-rot": `${item.spot.rot}deg`,
              animationDelay: `${item.spot.delay}s`,
            } as CSSProperties
          }
        >
          {MOTIFS[item.motif]}
        </svg>
      ))}
    </div>
  );
}
