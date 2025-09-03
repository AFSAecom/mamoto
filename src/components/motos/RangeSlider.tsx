// src/components/motos/RangeSlider.tsx
"use client";

import React, { useCallback, useMemo } from "react";

export type RangeTuple = [number, number];

type Props = {
  min: number;
  max: number;
  step?: number;
  /** Espace minimum entre les 2 curseurs */
  minGap?: number;
  value: RangeTuple;
  onChange: (next: RangeTuple) => void;
  /** Accessibilité */
  ariaLabelMin?: string;
  ariaLabelMax?: string;
};

/**
 * Double slider "pur HTML" (2 <input type="range">) avec track épaisse
 * - Poignées faciles à attraper
 * - Empêche le blocage du curseur gauche (respect de minGap)
 * - Track cliquable (zone large)
 */
export default function RangeSlider({
  min,
  max,
  step = 1,
  minGap = 1,
  value,
  onChange,
  ariaLabelMin = "Minimum",
  ariaLabelMax = "Maximum",
}: Props) {
  const [left, right] = value;

  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max]);

  const handleLeft = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = clamp(parseFloat(e.target.value));
      // On maintient minGap pour éviter le "blocage"
      if (next <= right - minGap) {
        onChange([next, right]);
      } else {
        onChange([right - minGap, right]);
      }
    },
    [right, onChange, clamp, minGap]
  );

  const handleRight = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = clamp(parseFloat(e.target.value));
      if (next >= left + minGap) {
        onChange([left, next]);
      } else {
        onChange([left, left + minGap]);
      }
    },
    [left, onChange, clamp, minGap]
  );

  const percent = useCallback(
    (v: number) => ((v - min) * 100) / (max - min),
    [min, max]
  );

  const leftPct = useMemo(() => percent(left), [left, percent]);
  const rightPct = useMemo(() => percent(right), [right, percent]);

  return (
    <div className="relative h-8">
      {/* rail de fond (épais) */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gray-200" />

      {/* segment sélectionné */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-red-500"
        style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
      />

      {/* inputs (double range) */}
      <input
        aria-label={ariaLabelMin}
        type="range"
        min={min}
        max={max}
        step={step}
        value={left}
        onChange={handleLeft}
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-8 w-full appearance-none bg-transparent pointer-events-auto"
        style={{ zIndex: 30 }}
      />
      <input
        aria-label={ariaLabelMax}
        type="range"
        min={min}
        max={max}
        step={step}
        value={right}
        onChange={handleRight}
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-8 w-full appearance-none bg-transparent pointer-events-auto"
        style={{ zIndex: 40 }}
      />

      {/* Styles pour les thumbs (WebKit + Firefox + Edge/Chromium) */}
      <style jsx>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: white;
          border: 3px solid #ef4444; /* rouge */
          box-shadow: 0 1px 2px rgba(0,0,0,.15);
          cursor: pointer;
          margin-top: -8px; /* centre le thumb sur la rail */
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: white;
          border: 3px solid #ef4444;
          box-shadow: 0 1px 2px rgba(0,0,0,.15);
          cursor: pointer;
        }
        input[type="range"]::-ms-thumb {
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: white;
          border: 3px solid #ef4444;
          box-shadow: 0 1px 2px rgba(0,0,0,.15);
          cursor: pointer;
        }

        /* Agrandit la zone cliquable sans épaissir la vraie rail */
        input[type="range"]::-webkit-slider-runnable-track {
          height: 32px; /* grande hitbox */
          background: transparent;
        }
        input[type="range"]::-moz-range-track {
          height: 32px;
          background: transparent;
        }
        input[type="range"]::-ms-track {
          height: 32px;
          background: transparent;
          border-color: transparent;
          color: transparent;
        }
      `}</style>
    </div>
  );
}
