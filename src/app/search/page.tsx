interface SearchPageProps {
  searchParams: { query?: string };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.query || '';
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-fg">Recherche</h1>
      <p className="mt-4 text-muted">Résultats pour : {query || 'aucune recherche'}.</p>
    </div>
  );
}
