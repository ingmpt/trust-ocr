import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { requestOpposition } from "../../api/arco";
import { extractErrorMessage } from "../../api/client";
import { Alert } from "../../components/Alert";
import { getArcoSession } from "./arcoSession";

export function ArcoOppositionPage() {
  const navigate = useNavigate(); const session = getArcoSession();
  const [reason, setReason] = useState(""); const [error, setError] = useState<string | null>(null); const [success, setSuccess] = useState<string | null>(null); const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => { if (!session) navigate("/arco/identificacion"); }, [session, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); if (!session) return; setError(null); setIsSubmitting(true);
    try { await requestOpposition(session.validation_token, reason); setSuccess("Solicitud de oposición enviada."); }
    catch (err) { setError(extractErrorMessage(err, "Error.")); }
    finally { setIsSubmitting(false); }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1>Solicitud de Oposición</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <p className="text-sm text-slate-600 mb-4">DNI: <strong>{session?.dni}</strong></p>
        {error && <Alert variant="error">{error}</Alert>}
        {success ? <Alert variant="success">{success}</Alert> : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Motivo de la Oposición</label><textarea required value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition">{isSubmitting ? "Enviando..." : "Enviar Solicitud"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
