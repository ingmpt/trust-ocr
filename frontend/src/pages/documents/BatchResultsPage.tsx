import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getDocumentResult } from "../../api/documents";
import type { DocumentResultRead } from "../../api/types";
import { Alert } from "../../components/Alert";

export function BatchResultsPage() {
  const [searchParams] = useSearchParams();
  const ids = (searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const [results, setResults] = useState<DocumentResultRead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) return;
    Promise.all(ids.map((id) => getDocumentResult(id).catch(() => null)))
      .then((data) => setResults(data.filter((r): r is DocumentResultRead => r !== null)))
      .catch(() => setError("No se pudieron cargar los resultados del lote."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading-message">Cargando resultados del lote...</p>;

  return (
    <div className="page">
      <h1>Resultados del Lote</h1>
      <p>{results.length} documento(s) procesado(s)</p>
      {error && <Alert variant="error">{error}</Alert>}

      <table className="results-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Campos extraídos</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {results.map((doc, index) => (
            <tr key={doc.id}>
              <td>{index + 1}</td>
              <td>{doc.document_type ?? "—"}</td>
              <td>{doc.status}</td>
              <td>{doc.extracted_fields ? Object.keys(doc.extracted_fields).length : 0}</td>
              <td>
                <Link to={`/documents/${doc.id}`}>Ver detalle</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="quick-links" style={{ marginTop: "1rem" }}>
        <Link to="/documents/upload">Procesar otro lote</Link>
        <Link to="/dashboard">Volver al Panel de Control</Link>
      </div>
    </div>
  );
}
