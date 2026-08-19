import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBatchStatus, listBatchDocuments, type BatchDocumentRead, type BatchStatusRead } from "../../api/batches";
import { Alert } from "../../components/Alert";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando...",
  completed: "Completado",
  failed: "Fallido",
};

export function BatchDetailPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const [batch, setBatch] = useState<BatchStatusRead | null>(null);
  const [documents, setDocuments] = useState<BatchDocumentRead[]>([]);
  const [error, setError] = useState<string | null>(null);

  function load() {
    if (!batchId) return;
    getBatchStatus(batchId).then(setBatch).catch(() => setError("Lote no encontrado."));
    listBatchDocuments(batchId).then(setDocuments).catch(() => {});
  }

  useEffect(load, [batchId]);

  // Auto-refresh while processing
  useEffect(() => {
    if (!batch || batch.status === "completed" || batch.status === "failed") return;
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [batch?.status]);

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!batch) return <p className="loading-message">Cargando...</p>;

  const progress = batch.total_files > 0 ? Math.round(((batch.processed_files + batch.failed_files) / batch.total_files) * 100) : 0;

  return (
    <div className="page">
      <h1>Detalle del Lote</h1>

      <section className="card">
        <p><strong>Estado:</strong> {STATUS_LABELS[batch.status] ?? batch.status}</p>
        <p><strong>Archivos totales:</strong> {batch.total_files}</p>
        <p><strong>Procesados:</strong> {batch.processed_files} | <strong>Fallidos:</strong> {batch.failed_files}</p>
        <p><strong>Modo:</strong> {batch.processing_mode}</p>
        <p><strong>Enviado:</strong> {new Date(batch.created_at).toLocaleString("es-PE")}</p>
        {batch.completed_at && <p><strong>Finalizado:</strong> {new Date(batch.completed_at).toLocaleString("es-PE")}</p>}

        {(batch.status === "pending" || batch.status === "processing") && (
          <>
            <progress value={progress} max={100} style={{ width: "100%", marginTop: "0.5rem" }} />
            <p className="proration-note">Progreso: {progress}% — esta página se actualiza automáticamente cada 5 segundos.</p>
          </>
        )}
      </section>

      {documents.length > 0 && (
        <section className="card">
          <h2>Documentos del Lote</h2>
          <table className="results-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Archivo</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Páginas</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, i) => (
                <tr key={doc.id}>
                  <td>{i + 1}</td>
                  <td>{doc.original_filename}</td>
                  <td>{doc.document_type ?? "—"}</td>
                  <td>{doc.status}</td>
                  <td>{doc.page_count}</td>
                  <td>
                    {doc.status === "completed" ? (
                      <Link to={`/documents/${doc.id}`}>Ver resultado</Link>
                    ) : (
                      doc.status
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <div className="quick-links" style={{ marginTop: "1rem" }}>
        <Link to="/batches">Todos mis lotes</Link>
        <Link to="/batches/upload">Enviar otro lote</Link>
        <Link to="/dashboard">Panel de Control</Link>
      </div>
    </div>
  );
}
