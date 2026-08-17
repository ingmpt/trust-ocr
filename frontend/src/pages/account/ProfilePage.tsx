import { useState, type FormEvent } from "react";
import { changeEmail, changePassword } from "../../api/auth";
import { extractErrorMessage } from "../../api/client";
import { Alert } from "../../components/Alert";
import { useAuth } from "../../context/AuthContext";

export function ProfilePage() {
  const { user } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleEmailChange(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    try {
      await changeEmail(newEmail);
      setSuccessMessage("Correo electrónico actualizado con éxito.");
      setNewEmail("");
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudo actualizar el correo electrónico."));
    }
  }

  async function handlePasswordChange(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (newPassword !== confirmNewPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      setSuccessMessage("Contraseña actualizada con éxito.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudo actualizar la contraseña."));
    }
  }

  return (
    <div className="page">
      <h1>Mi Cuenta - Perfil y Configuración</h1>
      {error && <Alert variant="error">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <section className="card">
        <h2>Correo Electrónico Actual</h2>
        <p>{user?.email}</p>
        <form onSubmit={handleEmailChange} className="payment-form" noValidate>
          <label htmlFor="newEmail">Nuevo Correo Electrónico</label>
          <input id="newEmail" type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          <button type="submit">Cambiar</button>
        </form>
      </section>

      <section className="card">
        <h2>Cambiar Contraseña</h2>
        <form onSubmit={handlePasswordChange} className="payment-form" noValidate>
          <label htmlFor="currentPassword">Contraseña Actual</label>
          <input
            id="currentPassword"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <label htmlFor="newPassword">Nueva Contraseña</label>
          <input
            id="newPassword"
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <label htmlFor="confirmNewPassword">Confirmar Nueva Contraseña</label>
          <input
            id="confirmNewPassword"
            type="password"
            required
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />

          <button type="submit">Cambiar Contraseña</button>
        </form>
      </section>
    </div>
  );
}
