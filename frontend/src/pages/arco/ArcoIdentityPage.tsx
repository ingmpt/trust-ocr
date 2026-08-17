import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { verifyIdentity } from "../../api/arco";
import { extractErrorMessage } from "../../api/client";
import { Alert } from "../../components/Alert";
import { saveArcoSession } from "./arcoSession";

export function ArcoIdentityPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dni, setDni] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!/^\d{8}$/.test(dni)) {
      setError("El DNI debe tener 8 dígitos.");
      return;
    }
    if (!photo) {
      setError("Debe subir una foto de su documento de identidad.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await verifyIdentity(dni, photo);
      saveArcoSession({ dni: result.dni, validation_token: result.validation_token });
      navigate("/arco/derecho");
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudo validar su identidad."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page auth-page">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h1>Portal ARCO — Identificación</h1>
        <p>
          De acuerdo con la Ley N° 29733, validamos tu identidad antes de procesar cualquier solicitud sobre tus datos
          personales.
        </p>
        {error && <Alert variant="error">{error}</Alert>}

        <label htmlFor="dni">DNI</label>
        <input id="dni" required maxLength={8} value={dni} onChange={(e) => setDni(e.target.value)} />

        <label htmlFor="identityPhoto">Foto del Documento de Identidad</label>
        <input
          id="identityPhoto"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          required
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
        />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Validando..." : "Validar Identidad"}
        </button>
      </form>
    </div>
  );
}
