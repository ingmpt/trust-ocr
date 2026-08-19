import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getArcoSession } from "./arcoSession";

const RIGHTS = [
  { code: "acceso", label: "Acceso", desc: "Solicita un reporte con tus datos personales.", icon: "📋", path: "/arco/acceso" },
  { code: "rectificacion", label: "Rectificación", desc: "Corrige campos mal leídos por el OCR.", icon: "✏️", path: "/arco/rectificacion" },
  { code: "cancelacion", label: "Cancelación", desc: "Eliminación permanente de tus datos.", icon: "🗑️", path: "/arco/cancelacion" },
  { code: "oposicion", label: "Oposición", desc: "Oponerte al procesamiento de tus datos.", icon: "🚫", path: "/arco/oposicion" },
];

export function ArcoRightSelectorPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => { if (!getArcoSession()) navigate("/arco/identificacion"); }, [navigate]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-center">Selecciona el Derecho a Ejercer</h1>
      <div className="grid gap-4 sm:grid-cols-2 mt-6">
        {RIGHTS.map((r) => (
          <button key={r.code} type="button" onClick={() => setSelected(r.code)} className={`text-left p-5 rounded-xl border-2 transition ${selected === r.code ? "border-blue-500 bg-blue-50 shadow-md" : "border-slate-200 bg-white hover:border-slate-300"}`}>
            <span className="text-2xl">{r.icon}</span>
            <h3 className="text-sm font-semibold text-slate-800 mt-2">{r.label}</h3>
            <p className="text-xs text-slate-500 mt-1">{r.desc}</p>
          </button>
        ))}
      </div>
      <button type="button" disabled={!selected} onClick={() => { const r = RIGHTS.find((x) => x.code === selected); if (r) navigate(r.path); }} className="mt-6 w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition">
        Continuar
      </button>
    </div>
  );
}
