interface PageProps {
  params: { brandId: string; model: string };
}

export default function MotoDetailsPage({ params }: PageProps) {
  const { brandId, model } = params;
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-fg">Détails du modèle {model}</h1>
      <p className="mt-4 text-muted">Marque #{brandId} - page en construction.</p>
    </div>
  );
}
