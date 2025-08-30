import { createMoto } from '../actions';
export default function NewMoto(){
  return(<div className="p-6 max-w-xl">
    <h1 className="text-xl font-semibold mb-4">Nouvelle moto</h1>
    <form action={createMoto} className="space-y-3">
      <input name="brand" className="w-full border p-2 rounded" placeholder="Marque" required />
      <input name="model" className="w-full border p-2 rounded" placeholder="Modèle" required />
      <input name="year"  className="w-full border p-2 rounded" placeholder="Année" type="number" min="1900" />
      <input name="price" className="w-full border p-2 rounded" placeholder="Prix" type="number" step="0.01" />
      <label className="flex items-center gap-2"><input type="checkbox" name="is_published" /> Publier</label>
      <button className="border px-3 py-2 rounded">Créer</button>
    </form>
  </div>);
}
