import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestAccess } from "../../api/arco";
import { extractErrorMessage } from "../../api/client";
import { Alert } from "../../components/Alert";
import { getArcoSession } from "./arcoSession";

export function ArcoAccessPage() {
  const navigate = useNavigate(); const session = getArcoSession();
  const [error, setError] = useState<string | null>(null); const [reportUrl, setReportUrl] = useState<string | null>(null); const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => { if (!session) navigate("/arco/identificacion"); }, [session, navigate]);

  async function handleGenerate() {
    if (!session) return; setIsSubmitting(true); setError(null);
    try { const r = await requestAccess(session.validation_token); setReportUrl(r.report_url); }
    catch (err) { setError(extractErrorMessage(err, "Error.")); }
    finally { setIsSubmitting(false); }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1>Solicitud de Acceso</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <p className="text-sm text-slate-600 mb-4">DNI: <strong>{session?.dni}</strong></p>
        <p className="text-sm text-slate-500 mb-4">Se generará un reporte PDF con los datos personales vigentes.</p>
        {error && <Alert variant="error">{error}</Alert>}
        {reportUrl ? <Alert variant="success">Reporte generado. Referencia: {reportUrl}</Alert> : (
          <button type="button" disabled={isSubmitting} onClick={handleGenerate} className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition">
            {isSubmitting ? "Generando..." : "Generar Reporte"}
          </button>
        )}
      </div>
    </div>
  );
}
