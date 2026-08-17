import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listRecentDocuments } from "../api/documents";
import { getMySubscription } from "../api/plans";
import type { DocumentResultRead, SubscriptionRead } from "../api/types";
import { Alert } from "../components/Alert";

export function DashboardPage() {
  const [subscription, setSubscription] = useState<SubscriptionRead | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<DocumentResultRead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [subscriptionData, documentsData] = await Promise.all([getMySubscription(), listRecentDocuments(5)]);
        setSubscription(subscriptionData);
        setRecentDocuments(documentsData);
      } catch {
        setError("No se pudo cargar la información del panel de control.");
      }
    }
    loadDashboard();
  }, []);

  const isNearLimit = subscription ? subscription.usage_percent >= 80 : false;
  const isBlocked = subscription ? subscription.pages_remaining === 0 && subscription.plan.code === "freemium" : false;

  return (
    <div className="page">
      <h1>Panel de Control</h1>
      {error && <Alert variant="error">{error}</Alert>}

      {subscription && (
        <section className="card">
          <h2>Mi Plan Actual: {subscription.plan.name}</h2>
          <p>
            {subscription.pages_used} / {subscription.plan.included_pages} páginas usadas ({subscription.usage_percent}%)
          </p>
          <progress value={subscription.usage_percent} max={100} />
          <p>Se reinicia el {new Date(subscription.current_period_end).toLocaleDateString("es-PE")}</p>

          {isBlocked && <Alert variant="error">Has agotado tus créditos Freemium. Actualiza tu plan para continuar procesando.</Alert>}
          {!isBlocked && isNearLimit && <Alert variant="info">Estás cerca de tu límite de páginas ({subscription.usage_percent}%).</Alert>}

          <Link to="/plans" className="button-link">
            Actualizar Plan
          </Link>
        </section>
      )}

      <section className="card">
        <h2>Accesos Rápidos</h2>
        <div className="quick-links">
          <Link to="/documents/upload">Cargar Documentos</Link>
          <Link to="/plans">Planes de Suscripción</Link>
          <Link to="/account/profile">Mi Cuenta</Link>
          <Link to="/billing/invoices">Historial de Facturas</Link>
          <Link to="/account/api-keys">Gestión de Claves API</Link>
        </div>
      </section>

      <section className="card">
        <h2>Documentos Recientes</h2>
        {recentDocuments.length === 0 && <p>Aún no has procesado documentos.</p>}
        <ul className="document-list">
          {recentDocuments.map((document) => (
            <li key={document.id}>
              <Link to={`/documents/${document.id}`}>
                {document.document_type ?? "Documento"} — {document.status} ({new Date(document.created_at).toLocaleString("es-PE")})
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
