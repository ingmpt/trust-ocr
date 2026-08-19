import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { verifyIdentity } from "../../api/arco";
import { extractErrorMessage } from "../../api/client";
import { Alert } from "../../components/Alert";
import { saveArcoSession } from "./arcoSession";

export function ArcoIdentityPage() {
  const navigate = useNavigate(); const fileInputRef = useRef<HTMLInputElement>(null);
  const [dni, setDni] = useState(""); const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null); const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null);
    if (!/^\d{8}$/.test(dni)) { setError("El DNI debe tener 8 dígitos."); return; }
    if (!photo) { setError("Suba una foto de su documento."); return; }
    setIsSubmitting(true);
    try { const r = await verifyIdentity(dni, photo); saveArcoSession({ dni: r.dni, validation_token: r.validation_token }); navigate("/arco/derecho"); }
    catch (err) { setError(extractErrorMessage(err, "No se pudo validar.")); }
    finally { setIsSubmitting(false); }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">Portal ARCO</h1>
          <p className="text-sm text-slate-500 mt-1">Derechos de Acceso, Rectificación, Cancelación y Oposición</p>
        </div>
        <form className="bg-white shadow-lg rounded-xl p-8 border border-slate-200" onSubmit={handleSubmit} noValidate>
          <h2 className="text-center mb-2">Validación de Identidad</h2>
          <p className="text-xs text-slate-500 text-center mb-6">Conforme a la Ley N° 29733, validamos tu identidad antes de procesar solicitudes.</p>
          {error && <Alert variant="error">{error}</Alert>}
          <div className="space-y-4">
            <div>
              <label htmlFor="dni" className="block text-sm font-medium text-slate-700 mb-1">DNI</label>
              <input id="dni" required maxLength={8} value={dni} onChange={(e) => setDni(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-slate-700 mb-1">Foto del Documento</label>
              <input id="photo" ref={fileInputRef} type="file" accept="image/*" required onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="w-full text-sm" />
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="mt-6 w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition">
            {isSubmitting ? "Validando..." : "Validar Identidad"}
          </button>
        </form>
      </div>
    </div>
  );
}
