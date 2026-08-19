import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createTemplate, previewExtraction, type ExtractedFieldPreview, type FieldDefinition } from "../../api/templates";
import { extractErrorMessage } from "../../api/client";
import { Alert } from "../../components/Alert";

export function TemplateCreatePage() {
  const navigate = useNavigate(); const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(""); const [description, setDescription] = useState("");
  const [previewFields, setPreviewFields] = useState<ExtractedFieldPreview[] | null>(null);
  const [selectedFields, setSelectedFields] = useState<Record<string, FieldDefinition>>({});
  const [isExtracting, setIsExtracting] = useState(false); const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState(""); const [newFieldLabel, setNewFieldLabel] = useState("");

  async function handlePreview() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) { setError("Selecciona un documento."); return; }
    setIsExtracting(true); setError(null);
    try {
      const fields = await previewExtraction(file); setPreviewFields(fields);
      const initial: Record<string, FieldDefinition> = {};
      for (const f of fields) initial[f.name] = { name: f.name, label: f.label };
      setSelectedFields(initial);
    } catch (err) { setError(extractErrorMessage(err, "Error al detectar campos.")); }
    finally { setIsExtracting(false); }
  }

  function toggleField(k: string, f: FieldDefinition) { setSelectedFields((p) => { const c = { ...p }; if (c[k]) delete c[k]; else c[k] = f; return c; }); }
  function addManualField() {
    if (!newFieldName.trim() || !newFieldLabel.trim()) return;
    const sn = newFieldName.trim().toLowerCase().replace(/\s+/g, "_");
    setSelectedFields((p) => ({ ...p, [sn]: { name: sn, label: newFieldLabel.trim() } }));
    setNewFieldName(""); setNewFieldLabel("");
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const defs = Object.values(selectedFields);
    if (!name.trim() || defs.length === 0) { setError("Nombre y al menos un campo requerido."); return; }
    setIsSaving(true); setError(null);
    try { await createTemplate({ name: name.trim(), description: description.trim(), field_definitions: defs }); navigate("/templates"); }
    catch (err) { setError(extractErrorMessage(err, "Error al guardar.")); }
    finally { setIsSaving(false); }
  }

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none";

  return (
    <div>
      <h1>Nueva Plantilla</h1>
      {error && <Alert variant="error">{error}</Alert>}

      {/* Step 1 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">1</span>
          <h2 className="mb-0">Sube un documento de ejemplo</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">El sistema detectará automáticamente los campos disponibles.</p>
        <div className="flex gap-3 items-end">
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="text-sm" />
          <button type="button" onClick={handlePreview} disabled={isExtracting} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition whitespace-nowrap">
            {isExtracting ? "Leyendo..." : "Detectar Campos"}
          </button>
        </div>
      </div>

      {/* Step 2 */}
      {previewFields && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">2</span>
            <h2 className="mb-0">Selecciona los campos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50"><th className="px-3 py-2 text-left">✓</th><th className="px-3 py-2 text-left">Campo</th><th className="px-3 py-2 text-left">Etiqueta</th><th className="px-3 py-2 text-left">Valor</th><th className="px-3 py-2 text-left">Confianza</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {previewFields.map((f) => (
                  <tr key={f.name} className="hover:bg-slate-50">
                    <td className="px-3 py-2"><input type="checkbox" checked={!!selectedFields[f.name]} onChange={() => toggleField(f.name, { name: f.name, label: f.label })} className="rounded border-slate-300" /></td>
                    <td className="px-3 py-2 font-mono text-xs">{f.name}</td>
                    <td className="px-3 py-2">{selectedFields[f.name] ? <input value={selectedFields[f.name].label} onChange={(e) => setSelectedFields((p) => ({ ...p, [f.name]: { ...p[f.name], label: e.target.value } }))} className="px-2 py-1 border border-slate-300 rounded text-sm w-full" /> : <span className="text-slate-400">{f.label}</span>}</td>
                    <td className="px-3 py-2 text-slate-600">{String(f.value ?? "—")}</td>
                    <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${f.confidence >= 90 ? "bg-emerald-100 text-emerald-700" : f.confidence >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{f.confidence}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 items-end mt-4">
            <input placeholder="nombre_campo" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm w-40" />
            <input placeholder="Etiqueta" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm w-40" />
            <button type="button" onClick={addManualField} className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300 transition">+ Agregar</button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {previewFields && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">3</span>
            <h2 className="mb-0">Nombra y guarda</h2>
          </div>
          <form onSubmit={handleSave} className="max-w-md space-y-3">
            <input placeholder="Nombre de la plantilla" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            <input placeholder="Descripción (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
            <p className="text-xs text-slate-400">{Object.keys(selectedFields).length} campo(s)</p>
            <button type="submit" disabled={isSaving} className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition">{isSaving ? "Guardando..." : "Guardar Plantilla"}</button>
          </form>
        </div>
      )}
    </div>
  );
}
