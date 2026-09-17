import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteTemplate, listTemplates, promoteTemplateToGlobal, type TemplateRead } from "../../api/templates";
import { Alert } from "../../components/Alert";
import { useAuth } from "../../context/AuthContext";

export function TemplatesListPage() {
  const { user } = useAuth(); const isAdmin = user?.role === "admin";
  const [templates, setTemplates] = useState<TemplateRead[]>([]); const [error, setError] = useState<string | null>(null); const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  function load() { listTemplates().then(setTemplates).catch(() => setError("No se pudieron cargar.")); }
  useEffect(load, []);
  async function confirmDelete(id: string) { await deleteTemplate(id); setPendingDeleteId(null); load(); }
  async function handlePromote(id: string) { await promoteTemplateToGlobal(id); load(); }

  const global = templates.filter((t) => t.user_id === null);
  const mine = templates.filter((t) => t.user_id !== null);

  function renderActions(id: string, showPromote = false) {
    return (
      <div className="flex gap-3 shrink-0">
        {pendingDeleteId === id ? (
          <>
            <button type="button" onClick={() => confirmDelete(id)} className="text-xs text-red-600 hover:underline">Confirmar</button>
            <button type="button" onClick={() => setPendingDeleteId(null)} className="text-xs text-slate-500 hover:underline">Cancelar</button>
          </>
        ) : (
          <>
            {showPromote && <button type="button" onClick={() => handlePromote(id)} className="text-xs text-emerald-600 hover:underline">Hacer global</button>}
            <Link to={`/templates/${id}/edit`} className="text-xs text-blue-600 hover:underline no-underline">Editar</Link>
            <button type="button" onClick={() => setPendingDeleteId(id)} className="text-xs text-red-500 hover:text-red-700">Eliminar</button>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="mb-0">Plantillas de Documento</h1>
        <Link to="/templates/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 no-underline transition">Nueva Plantilla</Link>
      </div>
      {error && <Alert variant="error">{error}</Alert>}

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2>Catálogo Global</h2>
        <p className="text-xs text-slate-400 mb-4">Plantillas disponibles para todos los usuarios.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {global.map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p className="text-sm font-medium text-slate-800">{t.name}</p>
                <p className="text-xs text-slate-500 mt-1">{t.field_definitions.length} campos — {t.description}</p>
              </div>
              {isAdmin && renderActions(t.id)}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2>Mis Plantillas</h2>
        {mine.length === 0 ? <p className="text-sm text-slate-500">Sin plantillas personalizadas.</p> : (
          <div className="space-y-3">
            {mine.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.field_definitions.length} campos</p>
                </div>
                {renderActions(t.id, isAdmin)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
