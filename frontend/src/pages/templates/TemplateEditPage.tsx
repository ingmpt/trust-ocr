import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { extractErrorMessage } from "../../api/client";
import { getTemplate, updateTemplate, type FieldDefinition } from "../../api/templates";
import { Alert } from "../../components/Alert";

export function TemplateEditPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId) return;
    getTemplate(templateId)
      .then((t) => { setName(t.name); setDescription(t.description); setFields(t.field_definitions); })
      .catch(() => setError("No se pudo cargar la plantilla."))
      .finally(() => setIsLoading(false));
  }, [templateId]);

  function updateFieldLabel(index: number, label: string) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, label } : f)));
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!templateId) return;
    if (!name.trim() || fields.length === 0) { setError("Nombre y al menos un campo requerido."); return; }
    setIsSaving(true); setError(null);
    try {
      await updateTemplate(templateId, { name: name.trim(), description: description.trim(), field_definitions: fields });
      navigate("/templates");
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudo guardar."));
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none";

  if (isLoading) return <p className="loading-message">Cargando...</p>;

  return (
    <div>
      <h1 className="mb-6">Editar Plantilla</h1>
      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 max-w-lg space-y-4">
        <input placeholder="Nombre" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        <input placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />

        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={f.name} className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 w-32 truncate" title={f.name}>{f.name}</span>
              <input value={f.label} onChange={(e) => updateFieldLabel(i, e.target.value)} className={`${inputClass} flex-1`} />
              <button type="button" onClick={() => removeField(i)} className="text-xs text-red-500 hover:text-red-700 shrink-0">Quitar</button>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition">
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </button>
          <button type="button" onClick={() => navigate("/templates")} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
