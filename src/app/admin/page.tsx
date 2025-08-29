export default function AdminDashboard() {
  return (
    <div>
      <nav className="mb-2 text-sm text-muted-foreground">Admin / Dashboard</nav>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 border rounded">Motos: 0</div>
        <div className="p-4 border rounded">Catégories: 0</div>
        <div className="p-4 border rounded">Clients: 0</div>
      </div>
    </div>
  );
}
