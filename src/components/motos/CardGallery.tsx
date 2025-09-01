// src/components/motos/CardGallery.tsx
"use client";

import React, { useState, useMemo, MouseEvent } from "react";

type Props = {
  urls: string[];
  className?: string;
  thumbHeight?: number; // px
};

/**
 * Galerie compacte pour la carte (liste /motos)
 * - Clique sur la grande image: passe à l'image suivante (et bloque la navigation du <Link> parent)
 * - Clique sur une miniature: affiche cette image en grand (et bloque la navigation du <Link> parent)
 */
export default function CardGallery({ urls, className, thumbHeight = 56 }: Props) {
  const clean = useMemo(() => (Array.isArray(urls) ? urls.filter(Boolean) : []), [urls]);
  const [idx, setIdx] = useState(0);

  if (clean.length === 0) {
    return (
      <div className={["aspect-[4/3] w-full overflow-hidden bg-black/10", className].filter(Boolean).join(" ")}>
        <div className="w-full h-full flex items-center justify-center text-sm opacity-60">
          Pas d'image
        </div>
      </div>
    );
  }

  const onMainClick = (e: MouseEvent) => {
    // Empêche la navigation du <Link> parent
    e.preventDefault();
    e.stopPropagation();
    setIdx((i) => (i + 1) % clean.length);
  };

  const onThumbClick = (e: MouseEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx(i);
  };

  return (
    <div className={className}>
      <div className="aspect-[4/3] w-full overflow-hidden bg-black/10">
        <img
          src={clean[idx]}
          alt="photo moto"
          className="w-full h-full object-cover transition"
          onClick={onMainClick}
          loading="lazy"
        />
      </div>

      {clean.length > 1 && (
        <div className="px-3 pt-2 pb-1 overflow-x-auto">
          <div className="flex gap-2">
            {clean.map((u, i) => (
              <button
                key={u + i}
                className={`flex-shrink-0 rounded border ${i === idx ? "border-white/60" : "border-white/10"} focus:outline-none`}
                style={{ height: thumbHeight, width: Math.round(thumbHeight * 1.4) }}
                onClick={(e) => onThumbClick(e, i)}
                aria-label={`miniature ${i + 1}`}
              >
                <img src={u} alt={`miniature ${i + 1}`} className="w-full h-full object-cover rounded" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
