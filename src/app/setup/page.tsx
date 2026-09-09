import Link from "next/link";
import { Database, ArrowRight, Check } from "lucide-react";
export default function SetupPage() {
  return (
    <main className="setup-page">
      <div className="setup-card">
        <span className="brand-mark large">
          <Database size={28} />
        </span>
        <span className="eyebrow">PRIMEROS PASOS</span>
        <h1>Conecta tu negocio.</h1>
        <p>
          La aplicación está lista para conectarse. Configura tu proyecto de
          Supabase para crear cuentas y guardar información.
        </p>
        <ol className="setup-steps">
          <li>
            <span>1</span>
            <div>
              <strong>Crea un proyecto en Supabase</strong>
              <p>
                En supabase.com, selecciona New project. El README te acompaña
                paso a paso.
              </p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>Ejecuta las dos migraciones</strong>
              <p>
                Abre SQL Editor y ejecuta, en orden, los archivos de
                supabase/migrations.
              </p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>Agrega las variables de entorno</strong>
              <p>
                Copia .env.example a .env.local, completa la URL y la clave
                pública, y reinicia npm run dev.
              </p>
            </div>
          </li>
        </ol>
        <div className="notice">
          <Check size={16} /> No se necesitan claves privadas para ejecutar la
          aplicación.
        </div>
        <Link href="/login" className="button primary full-width">
          Ir al inicio de sesión
          <ArrowRight size={16} />
        </Link>
        <Link
          href="/demo"
          className="button full-width"
          style={{ marginTop: 10 }}
        >
          Explorar con datos de ejemplo
        </Link>
      </div>
    </main>
  );
}
