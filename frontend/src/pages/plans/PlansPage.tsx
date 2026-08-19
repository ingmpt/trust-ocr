import { useEffect, useState } from "react";
import { extractErrorMessage } from "../../api/client";
import { getMySubscription, listPlans, upgradePlan } from "../../api/plans";
import type { PlanRead, SubscriptionRead } from "../../api/types";
import { Alert } from "../../components/Alert";

export function PlansPage() {
  const [plans, setPlans] = useState<PlanRead[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionRead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [upgradingCode, setUpgradingCode] = useState<string | null>(null);

  async function loadData() {
    const [p, s] = await Promise.all([listPlans(), getMySubscription()]);
    setPlans(p); setSubscription(s);
  }

  useEffect(() => { loadData().catch(() => setError("No se pudieron cargar los planes.")); }, []);

  async function handleUpgrade(code: string) {
    setError(null); setSuccessMessage(null); setUpgradingCode(code);
    try {
      await upgradePlan(code); await loadData();
      setSuccessMessage("Plan actualizado con éxito.");
    } catch (err) { setError(extractErrorMessage(err, "No se pudo actualizar.")); }
    finally { setUpgradingCode(null); }
  }

  const rank: Record<string, number> = { freemium: 0, basico: 1, crecimiento: 2, corporativo: 3 };

  return (
    <div>
      <h1>Planes de Suscripción</h1>
      {error && <Alert variant="error">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {plans.map((plan) => {
          const isCurrent = subscription?.plan.code === plan.code;
          const canUpgrade = subscription ? rank[plan.code] > rank[subscription.plan.code] : false;
          return (
            <div key={plan.id} className={`relative bg-white rounded-xl border-2 p-6 transition-shadow ${isCurrent ? "border-blue-500 shadow-lg shadow-blue-100" : "border-slate-200 hover:shadow-md"}`}>
              {isCurrent && <span className="absolute -top-3 left-4 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">Plan Actual</span>}
              <h3 className="text-lg font-bold text-slate-800 mt-1">{plan.name}</h3>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                S/ {plan.monthly_price_pen.toFixed(0)}
                <span className="text-sm font-normal text-slate-500"> /mes</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> {plan.included_pages.toLocaleString("es-PE")} páginas</li>
                {plan.overage_price_per_page_pen > 0 && <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> S/ {plan.overage_price_per_page_pen} pág. adicional</li>}
              </ul>
              {canUpgrade && (
                <button type="button" disabled={upgradingCode === plan.code} onClick={() => handleUpgrade(plan.code)} className="mt-6 w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition">
                  {upgradingCode === plan.code ? "Actualizando..." : "Actualizar"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-400">Las actualizaciones a mitad de ciclo se prorratean según los días restantes.</p>
    </div>
  );
}
