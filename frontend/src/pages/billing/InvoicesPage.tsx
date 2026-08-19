import { useEffect, useState } from "react";
import { listInvoices } from "../../api/billing";
import type { InvoiceRead } from "../../api/types";
import { Alert } from "../../components/Alert";

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { listInvoices().then(setInvoices).catch(() => setError("No se pudieron cargar.")); }, []);

  return (
    <div>
      <h1>Historial de Facturas</h1>
      {error && <Alert variant="error">{error}</Alert>}
      {invoices.length === 0 ? <p className="text-sm text-slate-500">Sin facturas generadas.</p> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left font-medium text-slate-600">Fecha</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Monto</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Descarga</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">{new Date(inv.created_at).toLocaleDateString("es-PE")}</td>
                  <td className="px-4 py-3 font-medium">S/ {inv.amount_pen.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inv.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{inv.status}</span>
                  </td>
                  <td className="px-4 py-3">{inv.pdf_url ? <a href={inv.pdf_url} target="_blank" rel="noreferrer">PDF</a> : <span className="text-slate-400">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
