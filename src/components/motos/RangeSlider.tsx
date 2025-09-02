"use client";
import React, { useMemo } from "react";

export type RangeTuple = [number, number];

type Props = {
  min: number;
  max: number;
  step?: number;
  minGap?: number;
  value: RangeTuple;
  onChange: (next: RangeTuple) => void;

  /** Backward compatible single label (we’ll split to min/max) */
  ariaLabel?: string;
  /** Preferred explicit labels */
  ariaLabelMin?: string;
  ariaLabelMax?: string;
};

/**
 * Double-ended range slider – accessible, robust, and easy to grab.
 * - Single thick rail (like automobile.tn), active track in red.
 * - Click on rail moves the nearest thumb.
 * - Left thumb is never locked; both move independently with minGap enforcement.
 */
export default function RangeSlider({
  min,
  max,
  step = 1,
  minGap = step,
  value,
  onChange,
  ariaLabel,
  ariaLabelMin,
  ariaLabelMax,
}: Props) {
  const [left, right] = value;
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const toPct = (v: number) => ((v - min) / (max - min)) * 100;

  const bg = useMemo(() => {
    const l = toPct(left);
    const r = toPct(right);
    return {
      background: `linear-gradient(to right,
        #E5E7EB 0%, #E5E7EB ${l}%,
        #D0021B ${l}%, #D0021B ${r}%,
        #E5E7EB ${r}%, #E5E7EB 100%)`,
    };
  }, [left, right, min, max]);

  const changeLeft = (next: number) => {
    next = clamp(next);
    if (next > right - minGap) next = right - minGap;
    onChange([next, right]);
  };
  const changeRight = (next: number) => {
    next = clamp(next);
    if (next < left + minGap) next = left + minGap;
    onChange([left, next]);
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const raw = min + ratio * (max - min);
    const snapped = Math.round(raw / step) * step;
    const distLeft = Math.abs(snapped - left);
    const distRight = Math.abs(snapped - right);
    if (distLeft <= distRight) changeLeft(snapped); else changeRight(snapped);
  };

  const labelMin = ariaLabelMin ?? (ariaLabel ? `${ariaLabel} min` : undefined);
  const labelMax = ariaLabelMax ?? (ariaLabel ? `${ariaLabel} max` : undefined);

  return (
    <div className="w-full select-none">
      <div
        className="h-3 w-full rounded-full relative cursor-pointer"
        style={bg}
        onClick={handleTrackClick}
      >
        {/* Left thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={left}
          aria-label={labelMin}
          onChange={(e) => changeLeft(Number(e.target.value))}
          className="absolute w-full appearance-none h-3 bg-transparent pointer-events-none
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-white
                     [&::-webkit-slider-thumb]:border
                     [&::-webkit-slider-thumb]:border-neutral-300
                     [&::-webkit-slider-thumb]:shadow
                     [&::-webkit-slider-thumb]:pointer-events-auto
                     focus:outline-none"
        />
        {/* Right thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={right}
          aria-label={labelMax}
          onChange={(e) => changeRight(Number(e.target.value))}
          className="absolute w-full appearance-none h-3 bg-transparent pointer-events-none
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-white
                     [&::-webkit-slider-thumb]:border
                     [&::-webkit-slider-thumb]:border-neutral-300
                     [&::-webkit-slider-thumb]:shadow
                     [&::-webkit-slider-thumb]:pointer-events-auto
                     focus:outline-none"
        />
      </div>
    </div>
  );
}
