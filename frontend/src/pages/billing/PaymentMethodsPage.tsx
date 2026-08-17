import { useEffect, useState, type FormEvent } from "react";
import { addPaymentMethod, listPaymentMethods, removePaymentMethod } from "../../api/billing";
import { extractErrorMessage } from "../../api/client";
import type { PaymentMethodRead } from "../../api/types";
import { Alert } from "../../components/Alert";

export function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethodRead[]>([]);
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function loadMethods() {
    listPaymentMethods().then(setMethods).catch(() => setError("No se pudieron cargar los métodos de pago."));
  }

  useEffect(loadMethods, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    try {
      await addPaymentMethod({
        card_number: cardNumber,
        exp_month: Number(expMonth),
        exp_year: Number(expYear),
        cvv,
        cardholder_name: cardholderName,
      });
      setCardNumber("");
      setExpMonth("");
      setExpYear("");
      setCvv("");
      setCardholderName("");
      setSuccessMessage("Método de pago guardado con éxito.");
      loadMethods();
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudo guardar el método de pago."));
    }
  }

  async function confirmDelete(id: string) {
    await removePaymentMethod(id);
    setPendingDeleteId(null);
    loadMethods();
  }

  return (
    <div className="page">
      <h1>Gestión de Métodos de Pago</h1>
      {error && <Alert variant="error">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <section className="card">
        <h2>Métodos Existentes</h2>
        {methods.length === 0 && <p>No tienes métodos de pago registrados.</p>}
        <ul className="document-list">
          {methods.map((method) => (
            <li key={method.id}>
              {method.brand.toUpperCase()} •••• {method.last4} — vence {method.exp_month}/{method.exp_year}
              {method.is_default && <span className="badge">Principal</span>}
              {pendingDeleteId === method.id ? (
                <span className="confirm-inline">
                  ¿Eliminar este método de pago?
                  <button type="button" onClick={() => confirmDelete(method.id)}>
                    Confirmar
                  </button>
                  <button type="button" onClick={() => setPendingDeleteId(null)}>
                    Cancelar
                  </button>
                </span>
              ) : (
                <button type="button" onClick={() => setPendingDeleteId(method.id)}>
                  Eliminar
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Añadir Nueva Tarjeta</h2>
        <form onSubmit={handleSubmit} className="payment-form" noValidate>
          <label htmlFor="cardNumber">Número de Tarjeta</label>
          <input id="cardNumber" required value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />

          <label htmlFor="expMonth">Mes de Vencimiento</label>
          <input id="expMonth" type="number" min={1} max={12} required value={expMonth} onChange={(e) => setExpMonth(e.target.value)} />

          <label htmlFor="expYear">Año de Vencimiento</label>
          <input id="expYear" type="number" required value={expYear} onChange={(e) => setExpYear(e.target.value)} />

          <label htmlFor="cvv">CVV</label>
          <input id="cvv" required value={cvv} onChange={(e) => setCvv(e.target.value)} />

          <label htmlFor="cardholderName">Nombre del Titular</label>
          <input id="cardholderName" required value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} />

          <button type="submit">Guardar</button>
        </form>
      </section>
    </div>
  );
}
