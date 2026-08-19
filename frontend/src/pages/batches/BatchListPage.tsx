import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listBatches, type BatchStatusRead } from "../../api/batches";
import { Alert } from "../../components/Alert";

const STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-slate-100 text-slate-600" },
  processing: { label: "Procesando", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completado", color: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Fallido", color: "bg-red-100 text-red-700" },
};

export function BatchListPage() {
  const [batches, setBatches] = useState<BatchStatusRead[]>([]); const [error, setError] = useState<string | null>(null);
  useEffect(() => { listBatches().then(setBatches).catch(() => setError("No se pudieron cargar.")); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="mb-0">Carga Masiva</h1>
        <Link to="/batches/upload" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 no-underline transition">Nuevo Lote</Link>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      {batches.length === 0 ? <p className="text-sm text-slate-500">Sin lotes enviados.</p> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left font-medium text-slate-600">Fecha</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Archivos</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Procesados</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Fallidos</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">{new Date(b.created_at).toLocaleString("es-PE")}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS[b.status]?.color ?? ""}`}>{STATUS[b.status]?.label ?? b.status}</span></td>
                  <td className="px-4 py-3">{b.total_files}</td>
                  <td className="px-4 py-3">{b.processed_files}</td>
                  <td className="px-4 py-3">{b.failed_files > 0 ? <span className="text-red-600">{b.failed_files}</span> : "0"}</td>
                  <td className="px-4 py-3"><Link to={`/batches/${b.id}`}>Detalle</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
