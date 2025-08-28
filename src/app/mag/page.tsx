import Link from "next/link";
import { listArticles } from "@/src/lib/articles";

export const dynamic = "force-static";

export default function MagPage() {
  const articles = listArticles();
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold mb-6">Magazine</h1>
      {articles.length === 0 ? (
        <p>Aucun article pour l’instant.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2">
          {articles.map(a => (
            <li key={a.slug} className="rounded-xl border p-4 hover:shadow">
              <h2 className="text-xl font-medium mb-1">
                <Link href={`/mag/${a.slug}`}>{a.title}</Link>
              </h2>
              <p className="text-sm text-gray-500 mb-2">{a.date}</p>
              {a.excerpt && <p className="line-clamp-3">{a.excerpt}</p>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
