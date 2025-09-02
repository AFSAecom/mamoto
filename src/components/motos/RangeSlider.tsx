// src/components/motos/RangeSlider.tsx
"use client";

import React, { useMemo, useRef } from "react";

export type RangeTuple = [number, number];

interface Props {
  min: number;
  max: number;
  step?: number;
  /** Minimum distance between the two thumbs (in value units). */
  minGap?: number;
  value: RangeTuple;
  onChange: (v: RangeTuple) => void;
  className?: string;
  disabled?: boolean;
  /** Accessibilité : étiquettes spécifiques pour chaque pouce */
  ariaLabelMin?: string;
  ariaLabelMax?: string;
  /**
   * Raccourci d'accessibilité : si fourni, on en déduit
   * ariaLabelMin = `${ariaLabel} min` et ariaLabelMax = `${ariaLabel} max`
   */
  ariaLabel?: string;
}

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const snap = (v: number, step: number, min: number) =>
  Math.round((v - min) / step) * step + min;

export default function RangeSlider({
  min,
  max,
  step = 1,
  minGap = 0,
  value,
  onChange,
  className = "",
  disabled = false,
  ariaLabelMin,
  ariaLabelMax,
  ariaLabel,
}: Props) {
  const [low, high] = value;
  const rangeRef = useRef<HTMLDivElement>(null);

  // Dérive les labels si ariaLabel est fourni
  const aMin = ariaLabelMin ?? (ariaLabel ? `${ariaLabel} min` : "Valeur minimale");
  const aMax = ariaLabelMax ?? (ariaLabel ? `${ariaLabel} max` : "Valeur maximale");

  const pct = useMemo(() => {
    const denom = max - min || 1;
    const toPct = (v: number) => clamp(((v - min) / denom) * 100, 0, 100);
    return { left: toPct(low), right: 100 - toPct(high) };
  }, [low, high, min, max]);

  function changeLow(v: number) {
    const nextLow = clamp(v, min, high - minGap);
    const snapped = snap(nextLow, step, min);
    onChange([snapped, high]);
  }

  function changeHigh(v: number) {
    const nextHigh = clamp(v, low + minGap, max);
    const snapped = snap(nextHigh, step, min);
    onChange([low, snapped]);
  }

  function handleTrackClick(e: React.MouseEvent) {
    if (!rangeRef.current || disabled) return;
    const rect = rangeRef.current.getBoundingClientRect();
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const raw = min + ratio * (max - min);
    const snapped = snap(raw, step, min);
    const distLow = Math.abs(snapped - low);
    const distHigh = Math.abs(snapped - high);
    if (distLow <= distHigh) changeLow(snapped);
    else changeHigh(snapped);
  }

  return (
    <div className={`relative w-full select-none ${className}`}>
      {/* Rail grise */}
      <div className="h-2 w-full rounded-full bg-neutral-600" />

      {/* Segment actif rouge */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-red-600"
        style={{ left: `${pct.left}%`, right: `${pct.right}%` }}
      />

      {/* Zone cliquable globale pour déplacer le pouce le plus proche */}
      <div
        ref={rangeRef}
        onMouseDown={handleTrackClick}
        className="absolute inset-0 cursor-pointer"
        aria-hidden="true"
      />

      {/* Input range inférieur */}
      <input
        type="range"
        aria-label={aMin}
        className="thumb thumb-left absolute inset-x-0 top-1/2 -translate-y-1/2 w-full appearance-none bg-transparent pointer-events-none"
        min={min}
        max={max}
        step={step}
        value={low}
        onChange={(e) => changeLow(Number(e.target.value))}
        disabled={disabled}
      />

      {/* Input range supérieur */}
      <input
        type="range"
        aria-label={aMax}
        className="thumb thumb-right absolute inset-x-0 top-1/2 -translate-y-1/2 w-full appearance-none bg-transparent pointer-events-none"
        min={min}
        max={max}
        step={step}
        value={high}
        onChange={(e) => changeHigh(Number(e.target.value))}
        disabled={disabled}
      />

      {/* Styles des thumbs (webkit, firefox) */}
      <style jsx>{`
        /* Masquer la piste par défaut : on dessine la nôtre */
        .thumb::-webkit-slider-runnable-track {
          height: 0;
        }
        .thumb::-moz-range-track {
          height: 0;
          background: transparent;
        }
        .thumb {
          pointer-events: none; /* l'input ne prend pas le focus souris, seuls les thumbs oui */
        }
        .thumb::-webkit-slider-thumb {
          pointer-events: auto;
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: #ffffff;
          border: 3px solid #dc2626; /* red-600 */
          box-shadow: 0 0 0 2px rgba(0,0,0,0.15);
          cursor: pointer;
          margin-top: -9px; /* centre le thumb sur la rail de 8px (h-2) */
        }
        .thumb::-moz-range-thumb {
          pointer-events: auto;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: #ffffff;
          border: 3px solid #dc2626;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.15);
          cursor: pointer;
        }
        .thumb:disabled::-webkit-slider-thumb {
          border-color: #9ca3af; /* neutral-400 */
        }
        .thumb:disabled::-moz-range-thumb {
          border-color: #9ca3af;
        }
      `}</style>
    </div>
  );
}
