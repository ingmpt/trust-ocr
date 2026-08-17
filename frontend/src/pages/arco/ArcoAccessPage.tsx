import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestAccess } from "../../api/arco";
import { extractErrorMessage } from "../../api/client";
import { Alert } from "../../components/Alert";
import { getArcoSession } from "./arcoSession";

export function ArcoAccessPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const session = getArcoSession();

  useEffect(() => {
    if (!session) navigate("/arco/identificacion");
  }, [session, navigate]);

  async function handleGenerate() {
    if (!session) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await requestAccess(session.validation_token);
      setReportUrl(result.report_url);
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudo generar el reporte."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1>Portal ARCO — Solicitud de Acceso</h1>
      <p>DNI validado: {session?.dni}</p>
      <p>Se generará un reporte en formato PDF con los datos personales vigentes asociados a tu DNI.</p>
      {error && <Alert variant="error">{error}</Alert>}

      {reportUrl ? (
        <Alert variant="success">Reporte generado con éxito. Referencia: {reportUrl}</Alert>
      ) : (
        <button type="button" disabled={isSubmitting} onClick={handleGenerate}>
          {isSubmitting ? "Generando..." : "Generar Reporte de Datos Personales"}
        </button>
      )}
    </div>
  );
}
