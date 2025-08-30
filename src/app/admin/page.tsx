import Link from 'next/link';
export default function AdminHome(){
  return(<div className="p-6 space-y-4">
    <h1 className="text-xl font-semibold">Espace Admin — Auth OK</h1>
    <div className="flex gap-3">
      <Link href="/admin/motos" className="border px-3 py-2 rounded">Gérer les motos</Link>
      <Link href="/admin/motos/new" className="border px-3 py-2 rounded">+ Nouvelle moto</Link>
    </div>
  </div>);
}
