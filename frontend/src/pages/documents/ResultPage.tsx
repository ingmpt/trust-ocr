import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { getDocumentResult } from "../../api/documents";
import { createTemplate, type FieldDefinition } from "../../api/templates";
import { extractErrorMessage } from "../../api/client";
import type { DocumentResultRead } from "../../api/types";
import { Alert } from "../../components/Alert";

export function ResultPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const [result, setResult] = useState<DocumentResultRead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [selectedFields, setSelectedFields] = useState<Record<string, FieldDefinition>>({});
  const [templateSuccess, setTemplateSuccess] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  useEffect(() => {
    if (!documentId) return;
    getDocumentResult(documentId).then(setResult).catch(() => setError("Documento no encontrado o no disponible."));
  }, [documentId]);

  function handleDownloadJson() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result.extracted_fields, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${result.id}.json`; a.click(); URL.revokeObjectURL(a.href);
  }

  function handleStartSaveAsTemplate() {
    if (!result?.extracted_fields) return;
    const initial: Record<string, FieldDefinition> = {};
    for (const k of Object.keys(result.extracted_fields)) initial[k] = { name: k, label: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) };
    setSelectedFields(initial);
    setShowTemplateEditor(true);
  }

  function toggleField(k: string) {
    setSelectedFields((prev) => { const c = { ...prev }; if (c[k]) delete c[k]; else c[k] = { name: k, label: k.replace(/_/g, " ").replace(/\b\w/g, (c2) => c2.toUpperCase()) }; return c; });
  }

  async function handleSaveTemplate(event: FormEvent) {
    event.preventDefault();
    const defs = Object.values(selectedFields);
    if (!templateName.trim() || defs.length === 0) { setTemplateError("Nombre y al menos un campo requerido."); return; }
    setIsSavingTemplate(true); setTemplateError(null);
    try {
      await createTemplate({ name: templateName.trim(), description: templateDesc.trim(), field_definitions: defs });
      setTemplateSuccess(`Plantilla "${templateName}" guardada.`);
      setShowTemplateEditor(false);
    } catch (err) { setTemplateError(extractErrorMessage(err, "Error al guardar.")); }
    finally { setIsSavingTemplate(false); }
  }

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!result) return <p className="text-center text-slate-500 py-12">Cargando resultado...</p>;

  const hasFields = result.extracted_fields && Object.keys(result.extracted_fields).length > 0;
  const isExpressUnavailable = result.processing_mode === "express" && result.status === "completed" && !result.extracted_fields;

  return (
    <div>
      <h1>Resultados de Procesamiento</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
          <span>ID: <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">{result.id}</code></span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${result.processing_mode === "express" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
            {result.processing_mode === "express" ? "Express" : "Almacenado"}
          </span>
          {result.document_type && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{result.document_type}</span>
          )}
        </div>

        {result.processing_mode === "express" && <Alert variant="info">Disponible sólo durante tu sesión activa. No será recuperable después.</Alert>}
        {result.processing_mode === "almacenado" && result.expires_at && <Alert variant="info">Se eliminará el {new Date(result.expires_at).toLocaleString("es-PE")}.</Alert>}
        {result.status === "failed" && <Alert variant="error">Error: {result.error_message}</Alert>}
        {isExpressUnavailable && <Alert variant="error">Los datos ya no están disponibles (sesión finalizada).</Alert>}

        {hasFields && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-600 rounded-tl-lg">Campo</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Valor</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 rounded-tr-lg">Confianza</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(result.extracted_fields!).map(([field, data]) => (
                    <tr key={field} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700">{field}</td>
                      <td className="px-4 py-3 text-slate-600">{String(data.value ?? "—")}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${data.confidence >= 90 ? "bg-emerald-100 text-emerald-700" : data.confidence >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                          {data.confidence}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <button type="button" onClick={handleDownloadJson} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">Descargar JSON</button>
              {!result.used_template && !showTemplateEditor && !templateSuccess && (
                <button type="button" onClick={handleStartSaveAsTemplate} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition">Guardar como Plantilla</button>
              )}
            </div>
          </>
        )}
      </div>

      {templateSuccess && <Alert variant="success">{templateSuccess}</Alert>}
      {templateError && <Alert variant="error">{templateError}</Alert>}

      {showTemplateEditor && hasFields && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2>Guardar como Plantilla</h2>
          <p className="text-sm text-slate-500 mb-4">Selecciona campos, modifica etiquetas y guarda.</p>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50"><th className="px-3 py-2 text-left">✓</th><th className="px-3 py-2 text-left">Campo</th><th className="px-3 py-2 text-left">Etiqueta</th><th className="px-3 py-2 text-left">Valor</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(result.extracted_fields!).map(([k, v]) => (
                  <tr key={k}>
                    <td className="px-3 py-2"><input type="checkbox" checked={!!selectedFields[k]} onChange={() => toggleField(k)} className="rounded border-slate-300" /></td>
                    <td className="px-3 py-2 text-slate-600">{k}</td>
                    <td className="px-3 py-2">{selectedFields[k] ? <input value={selectedFields[k].label} onChange={(e) => setSelectedFields((p) => ({ ...p, [k]: { ...p[k], label: e.target.value } }))} className="w-full px-2 py-1 border border-slate-300 rounded text-sm" /> : "—"}</td>
                    <td className="px-3 py-2 text-slate-500">{String(v.value ?? "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form onSubmit={handleSaveTemplate} className="max-w-md space-y-3">
            <input placeholder="Nombre de la plantilla" required value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <input placeholder="Descripción (opcional)" value={templateDesc} onChange={(e) => setTemplateDesc(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <p className="text-xs text-slate-400">{Object.keys(selectedFields).length} campo(s) seleccionado(s)</p>
            <div className="flex gap-2">
              <button type="submit" disabled={isSavingTemplate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition">{isSavingTemplate ? "Guardando..." : "Guardar"}</button>
              <button type="button" onClick={() => setShowTemplateEditor(false)} className="px-4 py-2 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300 transition">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-4 text-sm">
        <Link to="/documents/upload">Procesar otro documento</Link>
        <Link to="/dashboard">Panel de Control</Link>
      </div>
    </div>
  );
}
