import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { requestRectification } from "../../api/arco";
import { extractErrorMessage } from "../../api/client";
import { Alert } from "../../components/Alert";
import { getArcoSession } from "./arcoSession";

const RECTIFIABLE_FIELDS = ["nombres", "apellidos", "direccion", "ruc_emisor", "numero_dni"];

export function ArcoRectificationPage() {
  const navigate = useNavigate();
  const session = getArcoSession();
  const [fieldName, setFieldName] = useState(RECTIFIABLE_FIELDS[0]);
  const [newValue, setNewValue] = useState("");
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
      await requestRectification(session.validation_token, { [fieldName]: newValue }, reason);
      setSuccessMessage("Solicitud de rectificación enviada y aplicada con éxito.");
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudo enviar la solicitud de rectificación."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1>Portal ARCO — Solicitud de Rectificación</h1>
      <p>DNI validado: {session?.dni}</p>
      {error && <Alert variant="error">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {!successMessage && (
        <form onSubmit={handleSubmit} className="payment-form" noValidate>
          <label htmlFor="fieldName">Campo a Rectificar</label>
          <select id="fieldName" value={fieldName} onChange={(e) => setFieldName(e.target.value)}>
            {RECTIFIABLE_FIELDS.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>

          <label htmlFor="newValue">Nuevo Valor</label>
          <input id="newValue" required value={newValue} onChange={(e) => setNewValue(e.target.value)} />

          <label htmlFor="reason">Motivo de la Rectificación</label>
          <textarea id="reason" required value={reason} onChange={(e) => setReason(e.target.value)} />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar Solicitud de Rectificación"}
          </button>
        </form>
      )}
    </div>
  );
}
