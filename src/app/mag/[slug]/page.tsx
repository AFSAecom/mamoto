import { notFound } from "next/navigation";
import { getArticle } from "@/src/lib/articles";

export const dynamic = "force-static";

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const a = getArticle(params.slug);
  if (!a) return notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <a href="/mag" className="underline text-sm text-gray-500">← Magazine</a>
      <h1 className="text-3xl font-semibold mt-2 mb-2">{a.title}</h1>
      <p className="text-sm text-gray-500 mb-6">{a.date}</p>
      <article className="prose" dangerouslySetInnerHTML={{ __html: a.html }} />
    </main>
  );
}
