import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { requestCancellation } from "../../api/arco";
import { extractErrorMessage } from "../../api/client";
import { Alert } from "../../components/Alert";
import { getArcoSession } from "./arcoSession";

export function ArcoCancellationPage() {
  const navigate = useNavigate();
  const session = getArcoSession();
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!session) navigate("/arco/identificacion");
  }, [session, navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!session) return;
    setError(null);

    if (!confirmed) {
      setError("Debe confirmar que entiende que sus datos serán eliminados permanentemente.");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestCancellation(session.validation_token, reason, confirmed);
      setSuccessMessage("Tus datos personales han sido eliminados permanentemente.");
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudo procesar la solicitud de cancelación."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1>Portal ARCO — Solicitud de Cancelación</h1>
      <p>DNI validado: {session?.dni}</p>
      <Alert variant="error">
        Advertencia: esta acción elimina permanentemente tus datos personales de nuestros sistemas. Esta acción es
        irreversible.
      </Alert>
      {error && <Alert variant="error">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {!successMessage && (
        <form onSubmit={handleSubmit} className="payment-form" noValidate>
          <label htmlFor="reason">Motivo de la Cancelación (opcional)</label>
          <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />

          <label className="checkbox-label">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            Entiendo que mis datos serán eliminados permanentemente
          </label>

          <button type="submit" disabled={isSubmitting || !confirmed}>
            {isSubmitting ? "Procesando..." : "Confirmar Cancelación"}
          </button>
        </form>
      )}
    </div>
  );
}
