import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteTemplate, listTemplates, type TemplateRead } from "../../api/templates";
import { Alert } from "../../components/Alert";

export function TemplatesListPage() {
  const [templates, setTemplates] = useState<TemplateRead[]>([]); const [error, setError] = useState<string | null>(null); const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  function load() { listTemplates().then(setTemplates).catch(() => setError("No se pudieron cargar.")); }
  useEffect(load, []);
  async function confirmDelete(id: string) { await deleteTemplate(id); setPendingDeleteId(null); load(); }

  const global = templates.filter((t) => t.user_id === null);
  const mine = templates.filter((t) => t.user_id !== null);

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
            <div key={t.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm font-medium text-slate-800">{t.name}</p>
              <p className="text-xs text-slate-500 mt-1">{t.field_definitions.length} campos — {t.description}</p>
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
                <div className="flex gap-3">
                  {pendingDeleteId === t.id ? (
                    <>
                      <button type="button" onClick={() => confirmDelete(t.id)} className="text-xs text-red-600 hover:underline">Confirmar</button>
                      <button type="button" onClick={() => setPendingDeleteId(null)} className="text-xs text-slate-500 hover:underline">Cancelar</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setPendingDeleteId(t.id)} className="text-xs text-red-500 hover:text-red-700">Eliminar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
