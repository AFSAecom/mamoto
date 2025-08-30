export default function AdminNav() {
  return (
    <nav className="px-6 py-3 border-b">
      <ul className="flex gap-4 text-sm">
        <li><a href="/admin">Dashboard</a></li>
        <li><a href="/admin/motos">Motos</a></li>
        <li><a href="/admin/categories">Catégories</a></li>
        <li><a href="/admin/clients">Clients</a></li>
      </ul>
    </nav>
  );
}
