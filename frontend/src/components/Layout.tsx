import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      {user && (
        <header className="navbar" aria-label="Navegación principal">
          <Link to="/dashboard" className="navbar-brand">
            Trust OCR+
          </Link>
          <nav className="navbar-links">
            <Link to="/dashboard">Panel de Control</Link>
            <Link to="/documents/upload">Cargar Documentos</Link>
            <Link to="/plans">Planes</Link>
            <Link to="/billing/invoices">Facturas</Link>
            <Link to="/billing/payment-methods">Métodos de Pago</Link>
            <Link to="/account/profile">Mi Cuenta</Link>
            <Link to="/account/api-keys">Claves API</Link>
            <Link to="/templates">Plantillas</Link>
          </nav>
          <div className="navbar-user">
            <span>{user.email}</span>
            <button type="button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </header>
      )}
      <main className="app-content">{children}</main>
    </div>
  );
}
