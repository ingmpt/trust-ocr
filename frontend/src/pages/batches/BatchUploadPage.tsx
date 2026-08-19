import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitBatch } from "../../api/batches";
import { listTemplates, type TemplateRead } from "../../api/templates";
import { extractErrorMessage } from "../../api/client";
import { Alert } from "../../components/Alert";

export function BatchUploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingMode, setProcessingMode] = useState<"express" | "almacenado">("almacenado");
  const [templates, setTemplates] = useState<TemplateRead[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);

  useEffect(() => {
    listTemplates().then(setTemplates).catch(() => {});
  }, []);

  async function handleSubmit() {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith(".zip")) {
      setError("La Carga Masiva sólo acepta archivos ZIP.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitBatch(selectedFile, processingMode, selectedTemplateId || undefined);
      setBatchId(result.batch_id);
      setSuccess(result.message);
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudo enviar el lote."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1>Carga Masiva</h1>
      <p>Sube un archivo ZIP con múltiples documentos. El procesamiento se realiza en segundo plano y serás notificado al finalizar.</p>

      {error && <Alert variant="error">{error}</Alert>}
      {success && (
        <Alert variant="success">
          {success}
          <br />
          <button type="button" onClick={() => navigate(`/batches/${batchId}`)} style={{ marginTop: "0.5rem" }}>
            Ver Estado del Lote
          </button>
        </Alert>
      )}

      {!success && (
        <>
          <section className="card">
            <h2>Modo de Procesamiento</h2>
            <label className="radio-label">
              <input type="radio" name="mode" checked={processingMode === "almacenado"} onChange={() => setProcessingMode("almacenado")} />
              <strong>Almacenado (retención de 5 días)</strong> — recomendado para lotes.
            </label>
            <label className="radio-label">
              <input type="radio" name="mode" checked={processingMode === "express"} onChange={() => setProcessingMode("express")} />
              <strong>Express (sin persistencia)</strong> — resultados sólo durante la sesión activa.
            </label>
          </section>

          {templates.length > 0 && (
            <section className="card">
              <h2>Plantilla (opcional)</h2>
              <p className="proration-note">
                Si todos los documentos son del mismo tipo, selecciona una plantilla para acelerar el procesamiento.
                Si deja "Detección automática", cada documento se clasifica individualmente.
              </p>
              <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                <option value="">Detección automática por documento</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} ({tpl.field_definitions.length} campos){tpl.user_id === null ? " — Global" : ""}
                  </option>
                ))}
              </select>
            </section>
          )}

          <section className="card">
            <h2>Archivo ZIP</h2>
            <input ref={fileInputRef} type="file" accept=".zip" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
            {selectedFile && <p>Archivo: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>}
          </section>

          <button type="button" disabled={!selectedFile || isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? "Enviando..." : "Enviar Lote"}
          </button>
        </>
      )}
    </div>
  );
}
