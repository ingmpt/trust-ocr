import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { requestOpposition } from "../../api/arco";
import { extractErrorMessage } from "../../api/client";
import { Alert } from "../../components/Alert";
import { getArcoSession } from "./arcoSession";

export function ArcoOppositionPage() {
  const navigate = useNavigate();
  const session = getArcoSession();
  const [reason, setReason] = useState("");
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
    setIsSubmitting(true);
    try {
      await requestOpposition(session.validation_token, reason);
      setSuccessMessage("Solicitud de oposición enviada con éxito.");
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudo enviar la solicitud de oposición."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1>Portal ARCO — Solicitud de Oposición</h1>
      <p>DNI validado: {session?.dni}</p>
      {error && <Alert variant="error">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {!successMessage && (
        <form onSubmit={handleSubmit} className="payment-form" noValidate>
          <label htmlFor="reason">Motivo de la Oposición</label>
          <textarea id="reason" required value={reason} onChange={(e) => setReason(e.target.value)} />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar Solicitud de Oposición"}
          </button>
        </form>
      )}
    </div>
  );
}
