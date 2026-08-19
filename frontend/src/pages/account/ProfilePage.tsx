import { useState, type FormEvent } from "react";
import { changeEmail, changePassword } from "../../api/auth";
import { extractErrorMessage } from "../../api/client";
import { Alert } from "../../components/Alert";
import { useAuth } from "../../context/AuthContext";

export function ProfilePage() {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState(""); const [currentPassword, setCurrentPassword] = useState(""); const [newPassword, setNewPassword] = useState(""); const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null); const [success, setSuccess] = useState<string | null>(null);

  async function handleEmailChange(e: FormEvent) {
    e.preventDefault(); setError(null); setSuccess(null);
    try { await changeEmail(newEmail); setSuccess("Correo actualizado."); setNewEmail(""); }
    catch (err) { setError(extractErrorMessage(err, "Error.")); }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault(); setError(null); setSuccess(null);
    if (newPassword !== confirmNewPassword) { setError("Las contraseñas no coinciden."); return; }
    try { await changePassword(currentPassword, newPassword); setSuccess("Contraseña actualizada."); setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword(""); }
    catch (err) { setError(extractErrorMessage(err, "Error.")); }
  }

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none";

  return (
    <div>
      <h1>Mi Cuenta</h1>
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2>Correo Electrónico</h2>
          <p className="text-sm text-slate-500 mb-4">Actual: <strong>{user?.email}</strong></p>
          <form onSubmit={handleEmailChange} className="space-y-3">
            <input type="email" placeholder="Nuevo correo electrónico" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputClass} />
            <button type="submit" className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">Cambiar</button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2>Contraseña</h2>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <input type="password" placeholder="Contraseña actual" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
            <input type="password" placeholder="Nueva contraseña" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
            <input type="password" placeholder="Confirmar nueva contraseña" required value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className={inputClass} />
            <button type="submit" className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">Cambiar Contraseña</button>
          </form>
        </div>
      </div>
    </div>
  );
}
