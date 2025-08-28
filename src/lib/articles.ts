import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const DIR = path.join(process.cwd(), "content", "mag");

export type ArticleMeta = {
  slug: string; title: string; date: string;
  excerpt?: string; cover?: string; tags?: string[];
};
export type Article = ArticleMeta & { html: string };

export function listArticles(): ArticleMeta[] {
  if (!fs.existsSync(DIR)) return [];
  const files = fs.readdirSync(DIR).filter(f => f.endsWith(".md"));
  const metas = files.map(file => {
    const slug = file.replace(/\.md$/, "");
    const { data } = matter(fs.readFileSync(path.join(DIR, file), "utf8"));
    return {
      slug,
      title: data.title ?? slug,
      date: data.date ?? "",
      excerpt: data.excerpt ?? "",
      cover: data.cover ?? "",
      tags: Array.isArray(data.tags) ? data.tags : []
    } as ArticleMeta;
  });
  return metas.sort((a,b) => (b.date || "").localeCompare(a.date || ""));
}

export function getArticle(slug: string): Article | null {
  const file = path.join(DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const html = marked.parse(content) as string;
  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? "",
    excerpt: data.excerpt ?? "",
    cover: data.cover ?? "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    html
  };
}
