import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { to: "/dashboard", label: "Panel" },
  { to: "/documents/upload", label: "Digitalizar" },
  { to: "/batches", label: "Carga Masiva" },
  { to: "/templates", label: "Plantillas" },
  { to: "/plans", label: "Planes" },
  { to: "/billing/invoices", label: "Facturas" },
  { to: "/billing/payment-methods", label: "Pagos" },
  { to: "/account/profile", label: "Mi Cuenta" },
  { to: "/account/api-keys", label: "API Keys" },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {user && (
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <Link to="/dashboard" className="text-xl font-bold text-blue-600 no-underline hover:text-blue-700">
                Trust OCR+
              </Link>

              {/* Desktop nav */}
              <nav className="hidden lg:flex items-center gap-1">
                {NAV_LINKS.map((link) => (
                  <Link key={link.to} to={link.to} className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 no-underline transition-colors">
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="hidden lg:flex items-center gap-3">
                <span className="text-sm text-slate-500">{user.email}</span>
                <button type="button" onClick={handleLogout} className="px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
                  Salir
                </button>
              </div>

              {/* Mobile hamburger */}
              <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100" aria-label="Abrir menú">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="lg:hidden border-t border-slate-200 bg-white">
              <div className="px-4 py-3 space-y-1">
                {NAV_LINKS.map((link) => (
                  <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 no-underline">
                    {link.label}
                  </Link>
                ))}
                <div className="pt-3 border-t border-slate-200">
                  <p className="px-3 text-sm text-slate-500">{user.email}</p>
                  <button type="button" onClick={handleLogout} className="mt-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>
      )}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}
