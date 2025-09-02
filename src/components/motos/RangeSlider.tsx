// src/components/motos/RangeSlider.tsx
"use client";

import React, { useMemo } from "react";

export type RangeTuple = [number, number];

type Props = {
  min: number;
  max: number;
  step?: number;
  /** écart minimal entre les deux curseurs (ex: 1 pour l'année) */
  minGap?: number;
  /** valeur courante [minVal, maxVal] */
  value: RangeTuple;
  /** callback quand ça change */
  onChange: (next: RangeTuple) => void;

  /** labels d’accessibilité (annonce lecteurs d’écran) */
  ariaLabelMin?: string;
  ariaLabelMax?: string;
  /** désactiver le slider */
  disabled?: boolean;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function RangeSlider({
  min,
  max,
  step = 1,
  minGap = 0,
  value,
  onChange,
  ariaLabelMin,
  ariaLabelMax,
  disabled = false,
}: Props) {
  const [leftVal, rightVal] = value;

  const [leftPct, widthPct] = useMemo(() => {
    const denom = max - min || 1;
    const l = ((leftVal - min) / denom) * 100;
    const r = ((rightVal - min) / denom) * 100;
    return [l, Math.max(0, r - l)];
  }, [leftVal, rightVal, min, max]);

  const handleLeft = (raw: number) => {
    const newLeft = clamp(raw, min, rightVal - minGap);
    onChange([newLeft, rightVal]);
  };

  const handleRight = (raw: number) => {
    const newRight = clamp(raw, leftVal + minGap, max);
    onChange([leftVal, newRight]);
  };

  return (
    <div className="w-full">
      <div className="relative h-3 mt-2 mb-1">
        {/* piste grise */}
        <div className="slider-track" />
        {/* portion active rouge */}
        <div
          className="slider-range"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
        />
        {/* deux inputs overlappés (thumbs) */}
        <input
          type="range"
          aria-label={ariaLabelMin}
          min={min}
          max={max}
          step={step}
          value={leftVal}
          onChange={(e) => handleLeft(Number(e.target.value))}
          disabled={disabled}
          className="range-input"
        />
        <input
          type="range"
          aria-label={ariaLabelMax}
          min={min}
          max={max}
          step={step}
          value={rightVal}
          onChange={(e) => handleRight(Number(e.target.value))}
          disabled={disabled}
          className="range-input"
        />
      </div>

      {/* styles locaux (track épaisse + thumbs blancs, liseré rouge) */}
      <style jsx>{`
        .slider-track {
          position: absolute;
          inset: 0;
          background: #334155; /* slate-700 */
          border-radius: 9999px;
        }
        .slider-range {
          position: absolute;
          top: 0;
          bottom: 0;
          background: #dc2626; /* red-600 */
          border-radius: 9999px;
        }
        .range-input {
          -webkit-appearance: none;
          appearance: none;
          position: absolute;
          inset: 0;
          background: transparent;
          pointer-events: none; /* on clique sur le thumb seulement */
        }
        .range-input::-webkit-slider-runnable-track {
          height: 12px; /* épaisseur de la piste */
          background: transparent;
        }
        .range-input::-moz-range-track {
          height: 12px;
          background: transparent;
        }
        .range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          pointer-events: auto; /* important pour saisir le thumb */
          height: 20px;
          width: 20px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid #dc2626; /* rouge */
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
          margin-top: -4px; /* centrer sur la piste */
        }
        .range-input::-moz-range-thumb {
          pointer-events: auto;
          height: 20px;
          width: 20px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid #dc2626;
        }
      `}</style>
    </div>
  );
}
