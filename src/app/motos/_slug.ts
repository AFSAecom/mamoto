export function slugify(input: string): string {
  const s = (input || "")
    .normalize("NFD")
    // @ts-ignore - remove diacritics
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s;
}
