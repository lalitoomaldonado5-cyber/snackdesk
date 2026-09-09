"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="empty-state">
      <h2>No pudimos cargar esta información</h2>
      <p>
        Verifica tu conexión. Si el problema continúa, revisa la configuración y
        las migraciones de Supabase.
      </p>
      <button className="button primary" onClick={reset}>
        Volver a intentar
      </button>
    </div>
  );
}
