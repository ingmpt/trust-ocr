import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../../api/auth";
import { Alert } from "../../components/Alert";
import { extractErrorMessage } from "../../api/client";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Enlace de verificación incompleto.");
      return;
    }
    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setError(extractErrorMessage(err, "No se pudo verificar el correo."));
      });
  }, [token]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8 border border-slate-200 text-center">
        <h1 className="text-2xl font-bold text-blue-600 mb-6">Trust OCR+</h1>
        {status === "loading" && <p className="text-slate-500">Verificando tu correo...</p>}
        {status === "success" && (
          <>
            <Alert variant="success">Tu correo fue verificado correctamente.</Alert>
            <Link to="/login" className="text-blue-600 font-medium">Iniciar sesión</Link>
          </>
        )}
        {status === "error" && (
          <>
            <Alert variant="error">{error}</Alert>
            <Link to="/login" className="text-blue-600 font-medium">Volver a inicio de sesión</Link>
          </>
        )}
      </div>
    </div>
  );
}
