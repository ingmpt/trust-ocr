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
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h1>Iniciar Sesión</h1>
        {error && <Alert variant="error">{error}</Alert>}

        <label htmlFor="email">Correo Electrónico</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="password">Contraseña</label>
        <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Ingresando..." : "Iniciar Sesión"}
        </button>

        <p>
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
        <p>
          <Link to="/arco/identificacion">Portal de Derechos ARCO</Link>
        </p>
      </form>
    </div>
  );
}
