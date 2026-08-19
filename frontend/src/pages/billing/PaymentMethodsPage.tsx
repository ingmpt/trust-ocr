import { useEffect, useState, type FormEvent } from "react";
import { addPaymentMethod, listPaymentMethods, removePaymentMethod } from "../../api/billing";
import { extractErrorMessage } from "../../api/client";
import type { PaymentMethodRead } from "../../api/types";
import { Alert } from "../../components/Alert";

export function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethodRead[]>([]);
  const [cardNumber, setCardNumber] = useState(""); const [expMonth, setExpMonth] = useState(""); const [expYear, setExpYear] = useState(""); const [cvv, setCvv] = useState(""); const [cardholderName, setCardholderName] = useState("");
  const [error, setError] = useState<string | null>(null); const [success, setSuccess] = useState<string | null>(null); const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function load() { listPaymentMethods().then(setMethods).catch(() => setError("No se pudieron cargar.")); }
  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null); setSuccess(null);
    try {
      await addPaymentMethod({ card_number: cardNumber, exp_month: Number(expMonth), exp_year: Number(expYear), cvv, cardholder_name: cardholderName });
      setCardNumber(""); setExpMonth(""); setExpYear(""); setCvv(""); setCardholderName("");
      setSuccess("Método de pago guardado."); load();
    } catch (err) { setError(extractErrorMessage(err, "Error al guardar.")); }
  }

  async function confirmDelete(id: string) { await removePaymentMethod(id); setPendingDeleteId(null); load(); }

  return (
    <div>
      <h1>Métodos de Pago</h1>
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2>Métodos Existentes</h2>
          {methods.length === 0 ? <p className="text-sm text-slate-500">Sin métodos de pago.</p> : (
            <div className="space-y-3">
              {methods.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{m.brand === "visa" ? "💳" : "💳"}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{m.brand.toUpperCase()} •••• {m.last4}</p>
                      <p className="text-xs text-slate-500">Vence {m.exp_month}/{m.exp_year}</p>
                    </div>
                    {m.is_default && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Principal</span>}
                  </div>
                  {pendingDeleteId === m.id ? (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => confirmDelete(m.id)} className="text-xs text-red-600 hover:underline">Confirmar</button>
                      <button type="button" onClick={() => setPendingDeleteId(null)} className="text-xs text-slate-500 hover:underline">Cancelar</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setPendingDeleteId(m.id)} className="text-xs text-red-500 hover:text-red-700">Eliminar</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2>Añadir Tarjeta</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input placeholder="Número de tarjeta" required value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <div className="grid grid-cols-3 gap-3">
              <input placeholder="Mes" type="number" min={1} max={12} required value={expMonth} onChange={(e) => setExpMonth(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              <input placeholder="Año" type="number" required value={expYear} onChange={(e) => setExpYear(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              <input placeholder="CVV" required value={cvv} onChange={(e) => setCvv(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <input placeholder="Nombre del titular" required value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <button type="submit" className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">Guardar</button>
          </form>
        </div>
      </div>
    </div>
  );
}
