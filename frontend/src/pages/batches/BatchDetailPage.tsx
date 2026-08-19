import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBatchStatus, listBatchDocuments, type BatchDocumentRead, type BatchStatusRead } from "../../api/batches";
import { Alert } from "../../components/Alert";

const STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-slate-100 text-slate-600" },
  processing: { label: "Procesando", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completado", color: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Fallido", color: "bg-red-100 text-red-700" },
};

export function BatchDetailPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const [batch, setBatch] = useState<BatchStatusRead | null>(null); const [documents, setDocuments] = useState<BatchDocumentRead[]>([]); const [error, setError] = useState<string | null>(null);

  function load() {
    if (!batchId) return;
    getBatchStatus(batchId).then(setBatch).catch(() => setError("Lote no encontrado."));
    listBatchDocuments(batchId).then(setDocuments).catch(() => {});
  }

  useEffect(load, [batchId]);
  useEffect(() => {
    if (!batch || batch.status === "completed" || batch.status === "failed") return;
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [batch?.status]);

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!batch) return <p className="text-center text-slate-500 py-12">Cargando...</p>;

  const progress = batch.total_files > 0 ? Math.round(((batch.processed_files + batch.failed_files) / batch.total_files) * 100) : 0;
  const isActive = batch.status === "pending" || batch.status === "processing";

  return (
    <div>
      <h1>Detalle del Lote</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div><p className="text-xs text-slate-400">Estado</p><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS[batch.status]?.color ?? ""}`}>{STATUS[batch.status]?.label ?? batch.status}</span></div>
          <div><p className="text-xs text-slate-400">Total</p><p className="text-lg font-bold text-slate-800">{batch.total_files}</p></div>
          <div><p className="text-xs text-slate-400">Procesados</p><p className="text-lg font-bold text-emerald-600">{batch.processed_files}</p></div>
          <div><p className="text-xs text-slate-400">Fallidos</p><p className={`text-lg font-bold ${batch.failed_files > 0 ? "text-red-600" : "text-slate-400"}`}>{batch.failed_files}</p></div>
        </div>
        {isActive && (
          <div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2">
              <div className="h-2.5 rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-slate-400">Progreso: {progress}% — se actualiza cada 5 segundos</p>
          </div>
        )}
        <div className="flex gap-4 text-xs text-slate-500 mt-3">
          <span>Enviado: {new Date(batch.created_at).toLocaleString("es-PE")}</span>
          {batch.completed_at && <span>Finalizado: {new Date(batch.completed_at).toLocaleString("es-PE")}</span>}
        </div>
      </div>

      {documents.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left font-medium text-slate-600">#</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Archivo</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Págs</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc, i) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-700 truncate max-w-[200px]">{doc.original_filename}</td>
                  <td className="px-4 py-3 text-slate-600">{doc.document_type ?? "—"}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${doc.status === "completed" ? "bg-emerald-100 text-emerald-700" : doc.status === "failed" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{doc.status}</span></td>
                  <td className="px-4 py-3">{doc.page_count}</td>
                  <td className="px-4 py-3">{doc.status === "completed" ? <Link to={`/documents/${doc.id}`}>Ver</Link> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-4 text-sm">
        <Link to="/batches">Todos mis lotes</Link>
        <Link to="/batches/upload">Enviar otro lote</Link>
        <Link to="/dashboard">Panel de Control</Link>
      </div>
    </div>
  );
}
