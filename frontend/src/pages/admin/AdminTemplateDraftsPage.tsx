import { useEffect, useState } from "react";
import { approveDraftTemplate, listDraftTemplates, rejectDraftTemplate, type TemplateRead } from "../../api/templates";
import { Alert } from "../../components/Alert";

export function AdminTemplateDraftsPage() {
  const [drafts, setDrafts] = useState<TemplateRead[]>([]);
  const [error, setError] = useState<string | null>(null);

  function load() {
    listDraftTemplates().then(setDrafts).catch(() => setError("No se pudieron cargar los borradores."));
  }
  useEffect(load, []);

  async function handleApprove(id: string) {
    await approveDraftTemplate(id, { make_global: true });
    load();
  }

  async function handleReject(id: string) {
    await rejectDraftTemplate(id);
    load();
  }

  return (
    <div>
      <h1 className="mb-2">Plantillas Sugeridas (Borradores)</h1>
      <p className="text-sm text-slate-500 mb-6">
        Generadas automáticamente cuando un documento no coincide con ninguna plantilla existente. Apruébalas para
        que pasen al catálogo global, o recházalas para descartarlas.
      </p>
      {error && <Alert variant="error">{error}</Alert>}

      {drafts.length === 0 ? (
        <p className="text-sm text-slate-500">No hay borradores pendientes de revisión.</p>
      ) : (
        <div className="space-y-3">
          {drafts.map((t) => (
            <div key={t.id} className="p-4 bg-white rounded-xl border border-slate-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    Campos: {t.field_definitions.map((f) => f.label).join(", ")}
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApprove(t.id)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Aprobar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(t.id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
