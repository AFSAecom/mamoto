// src/components/motos/DetailGallery.tsx
\"use client\";

import React, { useMemo, useState } from \"react\";

type Props = {
  urls: string[];
};

export default function DetailGallery({ urls }: Props) {
  const clean = useMemo(() => (Array.isArray(urls) ? urls.filter(Boolean) : []), [urls]);
  const [idx, setIdx] = useState(0);

  if (clean.length === 0) {
    return (
      <div className=\"aspect-[4/3] bg-black/10\">
        <div className=\"w-full h-full flex items-center justify-center text-sm opacity-60\">Pas d'image</div>
      </div>
    );
  }

  const prev = () => setIdx((i) => (i - 1 + clean.length) % clean.length);
  const next = () => setIdx((i) => (i + 1) % clean.length);

  return (
    <div className=\"w-full\">
      <div className=\"relative rounded-xl border border-white/10 overflow-hidden\">
        <div className=\"aspect-[4/3] bg-black/10\">
          <img src={clean[idx]} alt={\`image \${idx + 1}\`} className=\"w-full h-full object-cover\" />
        </div>

        {clean.length > 1 && (
          <>
            <button
              onClick={prev}
              className=\"absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white px-2 py-1 rounded\"
              aria-label=\"Précédent\"
            >
              ‹
            </button>
            <button
              onClick={next}
              className=\"absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white px-2 py-1 rounded\"
              aria-label=\"Suivant\"
            >
              ›
            </button>
          </>
        )}
      </div>

      {clean.length > 1 && (
        <div className=\"px-1 py-2 overflow-x-auto\">
          <div className=\"flex gap-2\">
            {clean.map((u, i) => (
              <button
                key={u + i}
                onClick={() => setIdx(i)}
                className={\`h-16 w-24 rounded border \${i === idx ? \"border-white/60\" : \"border-white/10\"}\`}
                aria-label={\`miniature \${i + 1}\`}
              >
                <img src={u} alt={\`miniature \${i + 1}\`} className=\"w-full h-full object-cover rounded\" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
