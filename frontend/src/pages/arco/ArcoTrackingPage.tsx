import { useState, type FormEvent } from "react";
import { trackRequests } from "../../api/arco";
import { extractErrorMessage } from "../../api/client";
import type { ArcoRequestRead } from "../../api/types";
import { Alert } from "../../components/Alert";

const STATUS: Record<string, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "bg-slate-100 text-slate-600" },
  en_proceso: { label: "En Proceso", color: "bg-blue-100 text-blue-700" },
  completada: { label: "Completada", color: "bg-emerald-100 text-emerald-700" },
  rechazada: { label: "Rechazada", color: "bg-red-100 text-red-700" },
};

export function ArcoTrackingPage() {
  const [dni, setDni] = useState(""); const [requests, setRequests] = useState<ArcoRequestRead[] | null>(null); const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault(); setError(null);
    try { setRequests(await trackRequests(dni)); }
    catch (err) { setError(extractErrorMessage(err, "Error.")); }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-center">Seguimiento de Solicitudes ARCO</h1>
      {error && <Alert variant="error">{error}</Alert>}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input placeholder="DNI (8 dígitos)" required maxLength={8} value={dni} onChange={(e) => setDni(e.target.value)} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        <button type="submit" className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">Buscar</button>
      </form>
      {requests && (requests.length === 0 ? <p className="text-sm text-slate-500 text-center">Sin solicitudes para este DNI.</p> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left font-medium text-slate-600">Fecha</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Derecho</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Token</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{new Date(r.requested_at).toLocaleString("es-PE")}</td>
                  <td className="px-4 py-3 capitalize">{r.right_type}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS[r.status]?.color ?? ""}`}>{STATUS[r.status]?.label ?? r.status}</span></td>
                  <td className="px-4 py-3 font-mono text-xs">{r.validation_token}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
