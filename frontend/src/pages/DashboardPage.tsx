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
    Promise.all([getMySubscription(), listRecentDocuments(5)])
      .then(([s, d]) => { setSubscription(s); setRecentDocuments(d); })
      .catch(() => setError("No se pudo cargar la información del panel."));
  }, []);

  const isNearLimit = subscription ? subscription.usage_percent >= 80 : false;
  const isBlocked = subscription ? subscription.pages_remaining === 0 && subscription.plan.code === "freemium" : false;

  return (
    <div>
      <h1>Panel de Control</h1>
      {error && <Alert variant="error">{error}</Alert>}

      {subscription && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Mi Plan</p>
              <p className="text-2xl font-bold text-slate-800">{subscription.plan.name}</p>
            </div>
            <Link to="/plans" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 no-underline transition">
              Actualizar Plan
            </Link>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-slate-600 mb-1">
              <span>{subscription.pages_used} / {subscription.plan.included_pages} páginas</span>
              <span>{subscription.usage_percent}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div className={`h-3 rounded-full transition-all ${subscription.usage_percent >= 80 ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${Math.min(subscription.usage_percent, 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-400">Se reinicia el {new Date(subscription.current_period_end).toLocaleDateString("es-PE")}</p>
          </div>
          {isBlocked && <Alert variant="error">Créditos Freemium agotados. Actualiza tu plan para continuar.</Alert>}
          {!isBlocked && isNearLimit && <Alert variant="info">Estás cerca de tu límite ({subscription.usage_percent}%).</Alert>}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {[
          { to: "/documents/upload", label: "Digitalizar", icon: "📄" },
          { to: "/batches/upload", label: "Carga Masiva", icon: "📦" },
          { to: "/templates", label: "Plantillas", icon: "📋" },
          { to: "/account/api-keys", label: "API Keys", icon: "🔑" },
          { to: "/billing/invoices", label: "Facturas", icon: "🧾" },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="flex flex-col items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 no-underline transition">
            <span className="text-2xl mb-1">{item.icon}</span>
            <span className="text-sm font-medium text-slate-700">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2>Documentos Recientes</h2>
        {recentDocuments.length === 0 ? (
          <p className="text-slate-500 text-sm">Aún no has procesado documentos.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentDocuments.map((doc) => (
              <Link key={doc.id} to={`/documents/${doc.id}`} className="flex items-center justify-between py-3 no-underline hover:bg-slate-50 -mx-2 px-2 rounded-lg transition">
                <div>
                  <p className="text-sm font-medium text-slate-700">{doc.document_type ?? "Documento"}</p>
                  <p className="text-xs text-slate-400">{new Date(doc.created_at).toLocaleString("es-PE")}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${doc.status === "completed" ? "bg-emerald-100 text-emerald-700" : doc.status === "failed" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                  {doc.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
