// src/components/motos/RangeSlider.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type RangeSliderProps = {
  /** min bound */
  min: number;
  /** max bound */
  max: number;
  /** current [min, max] value (controlled) */
  value: [number, number];
  /** called on each change (debounced externally if needed) */
  onChange: (next: [number, number]) => void;
  /** step (default auto: 1 or 0.1 if very small range) */
  step?: number;
  /** minimal distance between thumbs */
  minGap?: number;
  /** aria label */
  ariaLabel?: string;
  /** disabled state */
  disabled?: boolean;
};

/**
 * A robust, accessible dual‑thumb slider with a thick red rail.
 * - Click on the rail moves the nearest thumb.
 * - Both thumbs are always draggable (left thumb is never "stuck").
 * - Values are clamped to [min,max] and respect a minGap.
 */
export default function RangeSlider({
  min,
  max,
  value,
  onChange,
  step,
  minGap = 0,
  ariaLabel,
  disabled = false,
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<"min" | "max" | null>(null);

  const safeStep = useMemo(() => {
    if (step && step > 0) return step;
    const span = Math.abs(max - min);
    return span <= 10 ? 0.1 : 1;
  }, [min, max, step]);

  const clamp = useCallback((n: number) => {
    const s = safeStep;
    const clamped = Math.min(max, Math.max(min, n));
    // Snap to step
    const k = Math.round((clamped - min) / s);
    return +(min + k * s).toFixed(s < 1 ? 1 : 0);
  }, [min, max, safeStep]);

  // Ensure incoming value is valid
  const [local, setLocal] = useState<[number, number]>(() => {
    const a = clamp(value[0]);
    const b = clamp(value[1]);
    const low = Math.min(a, b);
    const high = Math.max(a, b);
    return [low, Math.max(low + minGap, high)];
  });

  useEffect(() => {
    const a = clamp(value[0]);
    const b = clamp(value[1]);
    const low = Math.min(a, b);
    const high = Math.max(a, b);
    setLocal([low, Math.max(low + minGap, high)]);
  }, [value[0], value[1], clamp, minGap]);

  const pct = useCallback((n: number) => {
    return ((n - min) * 100) / (max - min || 1);
  }, [min, max]);

  const setByClientX = useCallback((clientX: number, which?: "min" | "max") => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = (clientX - rect.left) / (rect.width || 1);
    const raw = min + ratio * (max - min);
    const snapped = clamp(raw);

    const near = which ?? (Math.abs(snapped - local[0]) <= Math.abs(snapped - local[1]) ? "min" : "max");

    if (near === "min") {
      const nextMin = Math.min(snapped, local[1] - minGap);
      const next: [number, number] = [clamp(nextMin), local[1]];
      setLocal(next);
      onChange(next);
    } else {
      const nextMax = Math.max(snapped, local[0] + minGap);
      const next: [number, number] = [local[0], clamp(nextMax)];
      setLocal(next);
      onChange(next);
    }
  }, [trackRef, clamp, min, max, local, minGap, onChange]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    // Decide active thumb by nearest
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = (e.clientX - rect.left) / (rect.width || 1);
    const raw = min + ratio * (max - min);
    const near: "min" | "max" = Math.abs(raw - local[0]) <= Math.abs(raw - local[1]) ? "min" : "max";
    setActive(near);
    setByClientX(e.clientX, near);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!active || disabled) return;
    setByClientX(e.clientX, active);
  };

  const onPointerUp = () => setActive(null);

  const onKeyDown = (which: "min" | "max") => (e: React.KeyboardEvent) => {
    if (disabled) return;
    let delta = 0;
    if (e.key === "ArrowLeft") delta = -safeStep;
    if (e.key === "ArrowRight") delta = safeStep;
    if (delta === 0) return;
    e.preventDefault();
    if (which === "min") {
      const nextMin = Math.min(local[0] + delta, local[1] - minGap);
      const next: [number, number] = [clamp(nextMin), local[1]];
      setLocal(next);
      onChange(next);
    } else {
      const nextMax = Math.max(local[1] + delta, local[0] + minGap);
      const next: [number, number] = [local[0], clamp(nextMax)];
      setLocal(next);
      onChange(next);
    }
  };

  const left = pct(local[0]);
  const right = pct(local[1]);

  return (
    <div className="w-full py-1 select-none" aria-label={ariaLabel} role="group">
      <div
        ref={trackRef}
        className={`relative h-3 rounded-full bg-neutral-600 cursor-pointer ${disabled ? "opacity-50" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* filled portion */}
        <div
          className="absolute top-0 h-3 rounded-full bg-red-600"
          style={{ left: `${left}%`, width: `${Math.max(0, right - left)}%` }}
        />
        {/* left thumb */}
        <button
          type="button"
          aria-label="Valeur minimale"
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border border-neutral-400 shadow"
          style={{ left: `${left}%` }}
          onKeyDown={onKeyDown("min")}
        />
        {/* right thumb */}
        <button
          type="button"
          aria-label="Valeur maximale"
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border border-neutral-400 shadow"
          style={{ left: `${right}%` }}
          onKeyDown={onKeyDown("max")}
        />
      </div>
    </div>
  );
}
