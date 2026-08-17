import { useState, type FormEvent } from "react";
import { trackRequests } from "../../api/arco";
import { extractErrorMessage } from "../../api/client";
import type { ArcoRequestRead } from "../../api/types";
import { Alert } from "../../components/Alert";

export function ArcoTrackingPage() {
  const [dni, setDni] = useState("");
  const [requests, setRequests] = useState<ArcoRequestRead[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const result = await trackRequests(dni);
      setRequests(result);
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudieron obtener las solicitudes."));
    }
  }

  return (
    <div className="page">
      <h1>Portal ARCO — Seguimiento de Solicitudes</h1>
      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSearch} className="payment-form" noValidate>
        <label htmlFor="dni">DNI</label>
        <input id="dni" required maxLength={8} value={dni} onChange={(e) => setDni(e.target.value)} />
        <button type="submit">Buscar Solicitudes</button>
      </form>

      {requests && (
        <table className="results-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo de Derecho</th>
              <th>Estado</th>
              <th>Token de Validación</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={4}>No se encontraron solicitudes para este DNI.</td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id}>
                  <td>{new Date(request.requested_at).toLocaleString("es-PE")}</td>
                  <td>{request.right_type}</td>
                  <td>{request.status}</td>
                  <td>{request.validation_token}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
