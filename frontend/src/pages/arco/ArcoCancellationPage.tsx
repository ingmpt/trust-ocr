import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { requestCancellation } from "../../api/arco";
import { extractErrorMessage } from "../../api/client";
import { Alert } from "../../components/Alert";
import { getArcoSession } from "./arcoSession";

export function ArcoCancellationPage() {
  const navigate = useNavigate(); const session = getArcoSession();
  const [reason, setReason] = useState(""); const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null); const [success, setSuccess] = useState<string | null>(null); const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => { if (!session) navigate("/arco/identificacion"); }, [session, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); if (!session || !confirmed) { setError("Debe confirmar."); return; }
    setError(null); setIsSubmitting(true);
    try { await requestCancellation(session.validation_token, reason, true); setSuccess("Datos eliminados permanentemente."); }
    catch (err) { setError(extractErrorMessage(err, "Error.")); }
    finally { setIsSubmitting(false); }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1>Solicitud de Cancelación</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <p className="text-sm text-slate-600 mb-4">DNI: <strong>{session?.dni}</strong></p>
        <Alert variant="error">Esta acción elimina permanentemente tus datos. Es irreversible.</Alert>
        {error && <Alert variant="error">{error}</Alert>}
        {success ? <Alert variant="success">{success}</Alert> : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Motivo (opcional)</label><textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 rounded border-slate-300" />
              Entiendo que mis datos serán eliminados permanentemente
            </label>
            <button type="submit" disabled={isSubmitting || !confirmed} className="w-full py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-slate-300 transition">{isSubmitting ? "Procesando..." : "Confirmar Cancelación"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
