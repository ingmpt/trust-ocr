import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitBatch } from "../../api/batches";
import { listTemplates, type TemplateRead } from "../../api/templates";
import { extractErrorMessage } from "../../api/client";
import { Alert } from "../../components/Alert";

export function BatchUploadPage() {
  const navigate = useNavigate(); const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingMode, setProcessingMode] = useState<"express" | "almacenado">("almacenado");
  const [templates, setTemplates] = useState<TemplateRead[]>([]); const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null); const [batchId, setBatchId] = useState<string | null>(null);

  useEffect(() => { listTemplates().then(setTemplates).catch(() => {}); }, []);

  async function handleSubmit() {
    if (!selectedFile || !selectedFile.name.toLowerCase().endsWith(".zip")) { setError("Selecciona un archivo ZIP."); return; }
    setIsSubmitting(true); setError(null);
    try {
      const r = await submitBatch(selectedFile, processingMode, selectedTemplateId || undefined);
      setBatchId(r.batch_id); setSuccess(r.message);
    } catch (err) { setError(extractErrorMessage(err, "Error al enviar.")); }
    finally { setIsSubmitting(false); }
  }

  return (
    <div>
      <h1>Carga Masiva</h1>
      <p className="text-sm text-slate-500 mb-6">Sube un ZIP con múltiples documentos. Se procesará en segundo plano.</p>
      {error && <Alert variant="error">{error}</Alert>}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-sm text-emerald-800 font-medium mb-4">{success}</p>
          <button type="button" onClick={() => navigate(`/batches/${batchId}`)} className="px-6 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition">Ver Estado del Lote</button>
        </div>
      )}
      {!success && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center cursor-pointer hover:border-blue-300 transition" onClick={() => fileInputRef.current?.click()}>
              <div className="text-5xl mb-3">📦</div>
              <p className="text-sm font-medium text-slate-700">Haz clic para seleccionar un archivo ZIP</p>
              <p className="text-xs text-slate-400 mt-1">Conteniendo archivos JPEG, PNG o PDF</p>
              <input ref={fileInputRef} type="file" hidden accept=".zip" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
            </div>
            {selectedFile && (
              <div className="mt-3 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <span className="text-blue-600">📎</span>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{selectedFile.name}</p><p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p></div>
                <button type="button" onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-red-500">✕</button>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2>Modo</h2>
              {([["almacenado", "Almacenado", "Retención 5 días (recomendado)"], ["express", "Express", "Sin persistencia"]] as const).map(([v, l, d]) => (
                <label key={v} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition mt-2 ${processingMode === v ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <input type="radio" name="mode" checked={processingMode === v} onChange={() => setProcessingMode(v)} className="mt-0.5" />
                  <div><p className="text-sm font-medium">{l}</p><p className="text-xs text-slate-500">{d}</p></div>
                </label>
              ))}
            </div>
            {templates.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2>Plantilla</h2>
                <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Detección automática</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}
            <button type="button" disabled={!selectedFile || isSubmitting} onClick={handleSubmit} className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition text-sm">
              {isSubmitting ? "Enviando..." : "Enviar Lote"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
