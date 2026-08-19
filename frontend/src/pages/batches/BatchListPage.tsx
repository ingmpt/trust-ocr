import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listBatches, type BatchStatusRead } from "../../api/batches";
import { Alert } from "../../components/Alert";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando...",
  completed: "Completado",
  failed: "Fallido",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#6c757d",
  processing: "#0b5fff",
  completed: "#1e7e34",
  failed: "#8a1f11",
};

export function BatchListPage() {
  const [batches, setBatches] = useState<BatchStatusRead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listBatches().then(setBatches).catch(() => setError("No se pudieron cargar los lotes."));
  }, []);

  return (
    <div className="page">
      <h1>Mis Lotes</h1>
      {error && <Alert variant="error">{error}</Alert>}

      <Link to="/batches/upload" className="button-link">
        Nueva Carga Masiva
      </Link>

      {batches.length === 0 ? (
        <p style={{ marginTop: "1rem" }}>Aún no has enviado lotes de documentos.</p>
      ) : (
        <table className="results-table" style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Archivos</th>
              <th>Procesados</th>
              <th>Fallidos</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id}>
                <td>{new Date(b.created_at).toLocaleString("es-PE")}</td>
                <td style={{ color: STATUS_COLORS[b.status] ?? "#333", fontWeight: 600 }}>
                  {STATUS_LABELS[b.status] ?? b.status}
                </td>
                <td>{b.total_files}</td>
                <td>{b.processed_files}</td>
                <td>{b.failed_files}</td>
                <td>
                  <Link to={`/batches/${b.id}`}>Ver detalle</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
