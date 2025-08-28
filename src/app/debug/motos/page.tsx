import { loadAllMotos } from "../../../lib/motos.server";

export const dynamic = "force-static";

export default function DebugMotos() {
  const all = loadAllMotos();
  const first = all[0];
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Debug Motos</h1>
      <p className="text-sm text-gray-500 mb-4">{all.length} modèles chargés</p>
      <pre className="rounded bg-black/80 p-3 text-xs text-white overflow-auto">
{JSON.stringify(first ?? {}, null, 2)}
      </pre>
    </main>
  );
}

