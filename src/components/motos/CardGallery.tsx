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
 * - Clic sur la GRANDE image => laisse la navigation du <Link> parent (accès à la fiche modèle)
 * - Clic sur une MINIATURE => change l'image affichée en grand (et empêche la navigation)
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

  const onThumbClick = (e: MouseEvent, i: number) => {
    // On change l'image SANS naviguer vers la page détail
    e.preventDefault();
    e.stopPropagation();
    setIdx(i);
  };

  return (
    <div className={className}>
      {/* Pas de onClick ici -> clic sur l'image principale = navigation avec le <Link> parent */}
      <div className="aspect-[4/3] w-full overflow-hidden bg-black/10 cursor-pointer">
        <img
          src={clean[idx]}
          alt="photo moto"
          className="w-full h-full object-cover transition"
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
                type="button"
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
