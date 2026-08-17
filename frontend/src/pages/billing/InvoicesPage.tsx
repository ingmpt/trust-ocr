import { useEffect, useState } from "react";
import { listInvoices } from "../../api/billing";
import type { InvoiceRead } from "../../api/types";
import { Alert } from "../../components/Alert";

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listInvoices().then(setInvoices).catch(() => setError("No se pudieron cargar las facturas."));
  }, []);

  return (
    <div className="page">
      <h1>Historial de Facturas</h1>
      {error && <Alert variant="error">{error}</Alert>}

      {invoices.length === 0 ? (
        <p>Aún no tienes facturas generadas.</p>
      ) : (
        <table className="results-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Descarga</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{new Date(invoice.created_at).toLocaleDateString("es-PE")}</td>
                <td>S/ {invoice.amount_pen.toFixed(2)}</td>
                <td>{invoice.status}</td>
                <td>
                  {invoice.pdf_url ? (
                    <a href={invoice.pdf_url} target="_blank" rel="noreferrer">
                      Descargar PDF
                    </a>
                  ) : (
                    "No disponible"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
