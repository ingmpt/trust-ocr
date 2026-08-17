import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getArcoSession } from "./arcoSession";

const RIGHTS = [
  { code: "acceso", label: "Acceso", description: "Solicita un reporte con los datos personales que poseemos sobre ti.", path: "/arco/acceso" },
  { code: "rectificacion", label: "Rectificación", description: "Corrige campos de tus datos personales que hayan sido leídos incorrectamente.", path: "/arco/rectificacion" },
  { code: "cancelacion", label: "Cancelación", description: "Solicita la eliminación permanente de tus datos personales.", path: "/arco/cancelacion" },
  { code: "oposicion", label: "Oposición", description: "Te opones al procesamiento de tus datos personales.", path: "/arco/oposicion" },
];

export function ArcoRightSelectorPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!getArcoSession()) navigate("/arco/identificacion");
  }, [navigate]);

  function handleContinue() {
    const right = RIGHTS.find((r) => r.code === selected);
    if (right) navigate(right.path);
  }

  return (
    <div className="page">
      <h1>Portal ARCO — Selecciona el Derecho a Ejercer</h1>
      <div className="plans-grid">
        {RIGHTS.map((right) => (
          <label key={right.code} className={`plan-card ${selected === right.code ? "plan-card-current" : ""}`}>
            <input type="radio" name="right" checked={selected === right.code} onChange={() => setSelected(right.code)} />
            <h2>{right.label}</h2>
            <p>{right.description}</p>
          </label>
        ))}
      </div>
      <button type="button" disabled={!selected} onClick={handleContinue}>
        Continuar
      </button>
    </div>
  );
}
