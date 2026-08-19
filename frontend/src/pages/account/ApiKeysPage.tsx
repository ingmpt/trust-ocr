import { useEffect, useState, type FormEvent } from "react";
import { createApiKey, listApiKeys, revokeApiKey } from "../../api/auth";
import { extractErrorMessage } from "../../api/client";
import type { ApiKeyRead } from "../../api/types";
import { Alert } from "../../components/Alert";

export function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyRead[]>([]); const [newKeyName, setNewKeyName] = useState("");
  const [justCreatedKey, setJustCreatedKey] = useState<string | null>(null); const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() { listApiKeys().then(setApiKeys).catch(() => setError("No se pudieron cargar.")); }
  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault(); setError(null);
    try { const c = await createApiKey(newKeyName); setJustCreatedKey(c.raw_key); setNewKeyName(""); load(); }
    catch (err) { setError(extractErrorMessage(err, "Error.")); }
  }

  async function confirmRevoke(id: string) { await revokeApiKey(id); setPendingRevokeId(null); load(); }

  return (
    <div>
      <h1>Claves API</h1>
      {error && <Alert variant="error">{error}</Alert>}
      {justCreatedKey && (
        <Alert variant="success">
          Clave generada (guárdala ahora, no se volverá a mostrar):<br />
          <code className="text-xs bg-emerald-100 px-2 py-1 rounded mt-1 inline-block break-all">{justCreatedKey}</code>
        </Alert>
      )}
      <p className="text-sm text-slate-500 mb-6">Usa el encabezado <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">X-API-Key</code> para autenticar integraciones. Documentación en <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">/docs</code>.</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2>Claves Existentes</h2>
          {apiKeys.length === 0 ? <p className="text-sm text-slate-500">Sin claves API.</p> : (
            <div className="space-y-3">
              {apiKeys.map((k) => (
                <div key={k.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{k.name}</p>
                    <p className="text-xs text-slate-500 font-mono">•••{k.key_preview} {k.revoked_at && <span className="text-red-500">(revocada)</span>}</p>
                  </div>
                  {!k.revoked_at && (pendingRevokeId === k.id ? (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => confirmRevoke(k.id)} className="text-xs text-red-600 hover:underline">Confirmar</button>
                      <button type="button" onClick={() => setPendingRevokeId(null)} className="text-xs text-slate-500 hover:underline">Cancelar</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setPendingRevokeId(k.id)} className="text-xs text-red-500 hover:text-red-700">Revocar</button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2>Generar Nueva Clave</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input placeholder="Nombre descriptivo" required value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <button type="submit" className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">Generar Clave API</button>
          </form>
        </div>
      </div>
    </div>
  );
}
