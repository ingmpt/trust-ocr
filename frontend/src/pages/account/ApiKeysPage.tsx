import { useEffect, useState, type FormEvent } from "react";
import { createApiKey, listApiKeys, revokeApiKey } from "../../api/auth";
import { extractErrorMessage } from "../../api/client";
import type { ApiKeyRead } from "../../api/types";
import { Alert } from "../../components/Alert";

export function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyRead[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [justCreatedKey, setJustCreatedKey] = useState<string | null>(null);
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function loadKeys() {
    listApiKeys().then(setApiKeys).catch(() => setError("No se pudieron cargar las claves API."));
  }

  useEffect(loadKeys, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const created = await createApiKey(newKeyName);
      setJustCreatedKey(created.raw_key);
      setNewKeyName("");
      loadKeys();
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudo generar la clave API."));
    }
  }

  async function confirmRevoke(id: string) {
    await revokeApiKey(id);
    setPendingRevokeId(null);
    loadKeys();
  }

  return (
    <div className="page">
      <h1>Mi Cuenta - Gestión de Claves API</h1>
      {error && <Alert variant="error">{error}</Alert>}
      {justCreatedKey && (
        <Alert variant="success">
          Clave generada (guárdala ahora, no se volverá a mostrar): <code>{justCreatedKey}</code>
        </Alert>
      )}

      <p className="freemium-note">
        Usa el encabezado <code>X-API-Key</code> para autenticar tus integraciones. Consulta la documentación interactiva en{" "}
        <code>/docs</code>.
      </p>

      <section className="card">
        <h2>Claves Existentes</h2>
        {apiKeys.length === 0 && <p>No tienes claves API generadas.</p>}
        <ul className="document-list">
          {apiKeys.map((key) => (
            <li key={key.id}>
              {key.name} — •••{key.key_preview} {key.revoked_at ? "(revocada)" : ""}
              {!key.revoked_at &&
                (pendingRevokeId === key.id ? (
                  <span className="confirm-inline">
                    ¿Revocar esta clave?
                    <button type="button" onClick={() => confirmRevoke(key.id)}>
                      Confirmar
                    </button>
                    <button type="button" onClick={() => setPendingRevokeId(null)}>
                      Cancelar
                    </button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setPendingRevokeId(key.id)}>
                    Revocar
                  </button>
                ))}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Generar Nueva Clave API</h2>
        <form onSubmit={handleCreate} className="payment-form" noValidate>
          <label htmlFor="keyName">Nombre descriptivo</label>
          <input id="keyName" required value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
          <button type="submit">Generar Nueva Clave API</button>
        </form>
      </section>
    </div>
  );
}
