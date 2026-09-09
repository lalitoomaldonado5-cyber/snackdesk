import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <span className="eyebrow">404</span>
      <h1>No encontramos este registro</h1>
      <p>Puede haber sido eliminado o no estar disponible en tu negocio.</p>
      <Link className="button primary" href="/dashboard">
        Volver al dashboard
      </Link>
    </div>
  );
}
