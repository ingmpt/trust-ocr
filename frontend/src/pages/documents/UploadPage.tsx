import { useEffect, useRef, useState, type DragEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { uploadDocument } from "../../api/documents";
import { extractErrorMessage } from "../../api/client";
import { listTemplates, type TemplateRead } from "../../api/templates";
import { Alert } from "../../components/Alert";

const SUPPORTED_TYPES = [".jpg", ".jpeg", ".png", ".pdf"];

export function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingMode, setProcessingMode] = useState<"express" | "almacenado">("express");
  const [templates, setTemplates] = useState<TemplateRead[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => { listTemplates().then(setTemplates).catch(() => {}); }, []);

  function validateAndSetFile(file: File) {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!SUPPORTED_TYPES.includes(ext)) { setError(`Formato no soportado: ${ext}. Use JPEG, PNG o PDF. Para ZIP use Carga Masiva.`); return; }
    setError(null);
    setSelectedFile(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) validateAndSetFile(f); }

  async function handleProcess() {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    try {
      const result = await uploadDocument(selectedFile, processingMode, selectedTemplateId || undefined);
      navigate(`/documents/${result.id}`);
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudo procesar el documento."));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <h1>Digitalizar Documento</h1>
      <p className="text-sm text-slate-500 mb-6">Procesamiento individual (máx. 5 páginas por PDF). Para múltiples documentos use <Link to="/batches/upload">Carga Masiva</Link>.</p>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Dropzone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-300"}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <div className="text-4xl mb-3">📄</div>
            <p className="text-sm font-medium text-slate-700">Arrastra y suelta un archivo aquí</p>
            <p className="text-xs text-slate-400 mt-1">o haz clic para seleccionar (JPEG, PNG, PDF)</p>
            <input ref={fileInputRef} type="file" hidden accept={SUPPORTED_TYPES.join(",")} onChange={(e) => { const f = e.target.files?.[0]; if (f) validateAndSetFile(f); }} />
          </div>

          {selectedFile && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <span className="text-blue-600 text-lg">📎</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <button type="button" onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-red-500 text-lg">✕</button>
            </div>
          )}
        </div>

        {/* Settings sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2>Modo</h2>
            <div className="space-y-2">
              {([["express", "Express", "Sin persistencia, disponible sólo en sesión activa"], ["almacenado", "Almacenado", "Retención de 5 días"]] as const).map(([value, label, desc]) => (
                <label key={value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${processingMode === value ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <input type="radio" name="mode" checked={processingMode === value} onChange={() => setProcessingMode(value)} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {templates.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2>Plantilla</h2>
              <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                <option value="">Detección automática</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.field_definitions.length} campos)</option>)}
              </select>
            </div>
          )}

          <button type="button" disabled={!selectedFile || isUploading} onClick={handleProcess} className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:bg-slate-300 disabled:cursor-not-allowed transition text-sm">
            {isUploading ? "Procesando..." : "Procesar Documento"}
          </button>
        </div>
      </div>
    </div>
  );
}
