import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDocumentResult } from "../../api/documents";
import type { DocumentResultRead } from "../../api/types";
import { Alert } from "../../components/Alert";

export function ResultPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const [result, setResult] = useState<DocumentResultRead | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!result) return <p className="loading-message">Cargando resultado...</p>;

  const isExpressUnavailable = result.processing_mode === "express" && result.status === "completed" && !result.extracted_fields;

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

      {result.extracted_fields && (
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
              {Object.entries(result.extracted_fields).map(([field, data]) => (
                <tr key={field}>
                  <td>{field}</td>
                  <td>{String(data.value)}</td>
                  <td>{data.confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={handleDownloadJson}>
            Descargar JSON
          </button>
        </>
      )}

      <div className="quick-links">
        <Link to="/documents/upload">Procesar otro documento</Link>
        <Link to="/dashboard">Volver al Panel de Control</Link>
      </div>
    </div>
  );
}
