import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { extractErrorMessage } from "../../api/client";
import { Alert } from "../../components/Alert";
import { useAuth } from "../../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudo iniciar sesión."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Trust OCR+</h1>
          <p className="mt-2 text-slate-500">Digitalización inteligente de documentos</p>
        </div>
        <form className="bg-white shadow-lg rounded-xl p-8 border border-slate-200" onSubmit={handleSubmit} noValidate>
          <h2 className="text-xl font-semibold text-center mb-6">Iniciar Sesión</h2>
          {error && <Alert variant="error">{error}</Alert>}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="mt-6 w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:bg-slate-300 disabled:cursor-not-allowed transition">
            {isSubmitting ? "Ingresando..." : "Iniciar Sesión"}
          </button>

          <div className="mt-6 text-center text-sm space-y-2">
            <p>¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
            <p><Link to="/arco/identificacion" className="text-slate-500 hover:text-slate-700">Portal de Derechos ARCO</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}
