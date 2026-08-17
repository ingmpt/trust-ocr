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
    const [plansData, subscriptionData] = await Promise.all([listPlans(), getMySubscription()]);
    setPlans(plansData);
    setSubscription(subscriptionData);
  }

  useEffect(() => {
    loadData().catch(() => setError("No se pudieron cargar los planes."));
  }, []);

  async function handleUpgrade(planCode: string) {
    setError(null);
    setSuccessMessage(null);
    setUpgradingCode(planCode);
    try {
      await upgradePlan(planCode);
      await loadData();
      setSuccessMessage("Plan actualizado con éxito. Recibirás un correo de confirmación.");
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudo actualizar el plan."));
    } finally {
      setUpgradingCode(null);
    }
  }

  const planRank: Record<string, number> = { freemium: 0, basico: 1, crecimiento: 2, corporativo: 3 };

  return (
    <div className="page">
      <h1>Planes de Suscripción</h1>
      {error && <Alert variant="error">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <div className="plans-grid">
        {plans.map((plan) => {
          const isCurrent = subscription?.plan.code === plan.code;
          const canUpgrade = subscription ? planRank[plan.code] > planRank[subscription.plan.code] : false;

          return (
            <div key={plan.id} className={`plan-card ${isCurrent ? "plan-card-current" : ""}`}>
              <h2>{plan.name}</h2>
              {isCurrent && <span className="badge">Plan Actual</span>}
              <p className="plan-price">S/ {plan.monthly_price_pen.toFixed(2)} / mes</p>
              <p>{plan.included_pages.toLocaleString("es-PE")} páginas incluidas</p>
              {plan.overage_price_per_page_pen > 0 && <p>S/ {plan.overage_price_per_page_pen.toFixed(2)} por página adicional</p>}
              {canUpgrade && (
                <button type="button" disabled={upgradingCode === plan.code} onClick={() => handleUpgrade(plan.code)}>
                  {upgradingCode === plan.code ? "Actualizando..." : "Actualizar a este plan"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="proration-note">
        Las actualizaciones a mitad de ciclo se prorratean según los días restantes del período de facturación.
      </p>
    </div>
  );
}
