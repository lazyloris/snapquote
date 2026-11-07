import { useMemo } from "react";

/** A short confetti burst, pure CSS, for the moment a quote gets signed. */
export default function Burst({ color = "#4f46e5" }: { color?: string }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        dur: 1.1 + Math.random() * 0.9,
        rot: Math.random() * 720 - 360,
        drift: Math.random() * 160 - 80,
        color: [color, "#f59e0b", "#10b981", "#06b6d4", "#f43f5e"][i % 5],
        w: 6 + Math.random() * 6,
      })),
    [color],
  );
  return (
    <div className="burst" aria-hidden>
      {bits.map((b, i) => (
        <i
          key={i}
          style={{
            left: `${b.left}%`,
            width: b.w,
            height: b.w * 0.45,
            background: b.color,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
            ["--rot" as string]: `${b.rot}deg`,
            ["--drift" as string]: `${b.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
