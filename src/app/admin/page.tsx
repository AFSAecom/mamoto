"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

type Moto = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  price: number | null;
  main_image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [guarded, setGuarded] = useState(false);
  const [motos, setMotos] = useState<Moto[]>([]);
  const [form, setForm] = useState<Partial<Moto>>({});
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/admin/login");
        return;
      }
      const { data: allowed } = await supabase.rpc("is_admin");
      if (!allowed) {
        setError("Accès refusé (non-admin)");
        return;
      }
      setGuarded(true);
      setLoading(false);
    })();
  }, [router, supabase]);

  useEffect(() => {
    if (guarded) loadMotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guarded]);

  const loadMotos = async () => {
    const { data, error } = await supabase
      .from("motos")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) setMotos(data as Moto[]);
  };

  const resetForm = () => {
    setForm({});
    setFile(null);
    setError(null);
  };

  const onSave = async () => {
    setError(null);
    if (!form.brand || !form.model) {
      setError("Brand et Model sont obligatoires");
      return;
    }

    // 1) Upload image si fichier choisi
    let main_image_url = form.main_image_url ?? null;
    if (file) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `admin/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("motos")
        .upload(path, file);
      if (upErr) {
        setError("Upload image: " + upErr.message);
        return;
      }
      const { data: pub } = supabase.storage.from("motos").getPublicUrl(path);
      main_image_url = pub.publicUrl;
    }

    const payload = {
      brand: form.brand ?? "",
      model: form.model ?? "",
      year: form.year ?? null,
      price: form.price ?? null,
      is_published: form.is_published ?? true,
      main_image_url,
    };

    if (form.id) {
      const { error } = await supabase
        .from("motos")
        .update(payload)
        .eq("id", form.id);
      if (error) {
        setError(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("motos").insert(payload);
      if (error) {
        setError(error.message);
        return;
      }
    }
    resetForm();
    await loadMotos();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Supprimer cette moto ?")) return;
    const { error } = await supabase.from("motos").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    await loadMotos();
  };

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  if (loading) return <main className="p-6">Chargement…</main>;
  if (error) return <main className="p-6 text-red-600">{error}</main>;
  if (!guarded) return null;

  return (
    <main className="p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin — Motos</h1>
        <button onClick={onLogout} className="rounded-2xl border px-4 py-2">
          Se déconnecter
        </button>
      </header>

      {/* Formulaire création/édition */}
      <section className="rounded-2xl border p-4 space-y-3 bg-white">
        <h2 className="font-medium">
          {form.id ? "Modifier la moto" : "Ajouter une moto"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="border rounded px-3 py-2"
            placeholder="Brand"
            value={form.brand ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Model"
            value={form.model ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Year"
            type="number"
            value={form.year ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                year: e.target.value ? Number(e.target.value) : null,
              }))
            }
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Price"
            type="number"
            value={form.price ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                price: e.target.value ? Number(e.target.value) : null,
              }))
            }
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Image URL (optionnel si upload)"
            value={form.main_image_url ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, main_image_url: e.target.value }))
            }
          />
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_published ?? true}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_published: e.target.checked }))
              }
            />
            Publié
          </label>
          <div className="md:col-span-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onSave} className="rounded-2xl border px-4 py-2">
            Enregistrer
          </button>
          {form.id && (
            <button
              onClick={() => setForm({})}
              className="rounded-2xl border px-4 py-2"
            >
              Annuler
            </button>
          )}
        </div>
      </section>

      {/* Liste des motos */}
      <section className="rounded-2xl border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Image</th>
              <th className="text-left p-2">Brand</th>
              <th className="text-left p-2">Model</th>
              <th className="text-left p-2">Year</th>
              <th className="text-left p-2">Price</th>
              <th className="text-left p-2">Publié</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {motos.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="p-2">
                  {m.main_image_url ? (
                    <img
                      src={m.main_image_url}
                      alt=""
                      className="h-12 w-16 object-cover rounded"
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-2">{m.brand}</td>
                <td className="p-2">{m.model}</td>
                <td className="p-2">{m.year ?? "-"}</td>
                <td className="p-2">{m.price ?? "-"}</td>
                <td className="p-2">{m.is_published ? "Oui" : "Non"}</td>
                <td className="p-2 flex flex-wrap gap-2">
                  <button
                    className="border rounded px-2 py-1"
                    onClick={() => setForm(m)}
                  >
                    Éditer
                  </button>
                  <button
                    className="border rounded px-2 py-1"
                    onClick={() => onDelete(m.id)}
                  >
                    Supprimer
                  </button>
                  <a
                    href={`/admin/specs/${m.id}`}
                    className="border rounded px-2 py-1"
                  >
                    Caractéristiques
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
