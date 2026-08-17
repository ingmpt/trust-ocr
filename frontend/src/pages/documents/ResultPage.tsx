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

  // Estado para "Guardar como Plantilla"
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [selectedFields, setSelectedFields] = useState<Record<string, FieldDefinition>>({});
  const [templateSuccess, setTemplateSuccess] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  useEffect(() => {
    if (!documentId) return;
    getDocumentResult(documentId)
      .then(setResult)
      .catch(() => setError("Documento no encontrado o ya no disponible."));
  }, [documentId]);

  function handleDownloadJson() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result.extracted_fields, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleStartSaveAsTemplate() {
    if (!result?.extracted_fields) return;
    const initial: Record<string, FieldDefinition> = {};
    for (const fieldName of Object.keys(result.extracted_fields)) {
      initial[fieldName] = { name: fieldName, label: fieldName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) };
    }
    setSelectedFields(initial);
    setShowTemplateEditor(true);
  }

  function toggleField(fieldName: string) {
    setSelectedFields((prev) => {
      const copy = { ...prev };
      if (copy[fieldName]) {
        delete copy[fieldName];
      } else {
        copy[fieldName] = { name: fieldName, label: fieldName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) };
      }
      return copy;
    });
  }

  function updateFieldLabel(fieldName: string, newLabel: string) {
    setSelectedFields((prev) => ({ ...prev, [fieldName]: { ...prev[fieldName], label: newLabel } }));
  }

  async function handleSaveTemplate(event: FormEvent) {
    event.preventDefault();
    const fieldDefs = Object.values(selectedFields);
    if (!templateName.trim() || fieldDefs.length === 0) {
      setTemplateError("Ingresa un nombre y selecciona al menos un campo.");
      return;
    }
    setIsSavingTemplate(true);
    setTemplateError(null);
    try {
      await createTemplate({ name: templateName.trim(), description: templateDesc.trim(), field_definitions: fieldDefs });
      setTemplateSuccess(`Plantilla "${templateName}" guardada con éxito. La encontrarás en "Plantillas" y en el selector de carga.`);
      setShowTemplateEditor(false);
    } catch (err) {
      setTemplateError(extractErrorMessage(err, "No se pudo guardar la plantilla."));
    } finally {
      setIsSavingTemplate(false);
    }
  }

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!result) return <p className="loading-message">Cargando resultado...</p>;

  const isExpressUnavailable = result.processing_mode === "express" && result.status === "completed" && !result.extracted_fields;
  const hasFields = result.extracted_fields && Object.keys(result.extracted_fields).length > 0;

  return (
    <div className="page">
      <h1>Resultados de Procesamiento</h1>
      <p>Identificador: {result.id}</p>
      <p>
        Modo: <strong>{result.processing_mode === "express" ? "Express (sin persistencia)" : "Almacenado (5 días)"}</strong>
      </p>
      {result.processing_mode === "express" && (
        <Alert variant="info">Este resultado sólo está disponible durante tu sesión activa. Una vez que cierres sesión, no será recuperable.</Alert>
      )}
      {result.processing_mode === "almacenado" && result.expires_at && (
        <Alert variant="info">Estos datos se eliminarán automáticamente el {new Date(result.expires_at).toLocaleString("es-PE")}.</Alert>
      )}

      {result.status === "failed" && <Alert variant="error">Error de procesamiento: {result.error_message}</Alert>}
      {isExpressUnavailable && <Alert variant="error">Los datos ya no están disponibles (sesión finalizada).</Alert>}

      {hasFields && (
        <>
          <table className="results-table">
            <thead>
              <tr>
                <th>Campo</th>
                <th>Valor</th>
                <th>Confianza</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.extracted_fields!).map(([field, data]) => (
                <tr key={field}>
                  <td>{field}</td>
                  <td>{String(data.value)}</td>
                  <td>{data.confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
            <button type="button" onClick={handleDownloadJson}>Descargar JSON</button>
            {!result.used_template && !showTemplateEditor && !templateSuccess && (
              <button type="button" onClick={handleStartSaveAsTemplate} style={{ background: "#1e7e34" }}>
                Guardar como Plantilla
              </button>
            )}
          </div>
        </>
      )}

      {templateSuccess && <Alert variant="success">{templateSuccess}</Alert>}
      {templateError && <Alert variant="error">{templateError}</Alert>}

      {showTemplateEditor && hasFields && (
        <section className="card" style={{ marginTop: "1rem" }}>
          <h2>Guardar como Plantilla Personalizada</h2>
          <p className="proration-note">Selecciona los campos que quieres incluir en la plantilla. Puedes modificar las etiquetas o deseleccionar campos que no te interesan.</p>

          <table className="results-table">
            <thead>
              <tr>
                <th>Incluir</th>
                <th>Campo</th>
                <th>Etiqueta (editable)</th>
                <th>Valor detectado</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.extracted_fields!).map(([field, data]) => (
                <tr key={field}>
                  <td><input type="checkbox" checked={!!selectedFields[field]} onChange={() => toggleField(field)} /></td>
                  <td>{field}</td>
                  <td>
                    {selectedFields[field] ? (
                      <input value={selectedFields[field].label} onChange={(e) => updateFieldLabel(field, e.target.value)} style={{ width: "100%" }} />
                    ) : (
                      <span style={{ color: "#888" }}>{field}</span>
                    )}
                  </td>
                  <td>{String(data.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <form onSubmit={handleSaveTemplate} className="payment-form" style={{ marginTop: "1rem" }}>
            <label htmlFor="tplName">Nombre de la plantilla</label>
            <input id="tplName" required value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Ej: Recibo Sedapal" />
            <label htmlFor="tplDesc">Descripción (opcional)</label>
            <input id="tplDesc" value={templateDesc} onChange={(e) => setTemplateDesc(e.target.value)} />
            <p className="proration-note">Campos seleccionados: {Object.keys(selectedFields).length}</p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="submit" disabled={isSavingTemplate}>{isSavingTemplate ? "Guardando..." : "Guardar Plantilla"}</button>
              <button type="button" onClick={() => setShowTemplateEditor(false)} style={{ background: "#6c757d" }}>Cancelar</button>
            </div>
          </form>
        </section>
      )}

      <div className="quick-links" style={{ marginTop: "1rem" }}>
        <Link to="/documents/upload">Procesar otro documento</Link>
        <Link to="/dashboard">Volver al Panel de Control</Link>
      </div>
    </div>
  );
}
