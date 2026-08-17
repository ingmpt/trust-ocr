import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createTemplate, previewExtraction, type ExtractedFieldPreview, type FieldDefinition } from "../../api/templates";
import { extractErrorMessage } from "../../api/client";
import { Alert } from "../../components/Alert";

export function TemplateCreatePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [previewFields, setPreviewFields] = useState<ExtractedFieldPreview[] | null>(null);
  const [selectedFields, setSelectedFields] = useState<Record<string, FieldDefinition>>({});
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");

  async function handlePreview() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Selecciona un documento de ejemplo para detectar los campos.");
      return;
    }
    setIsExtracting(true);
    setError(null);
    try {
      const fields = await previewExtraction(file);
      setPreviewFields(fields);
      const initial: Record<string, FieldDefinition> = {};
      for (const f of fields) {
        initial[f.name] = { name: f.name, label: f.label };
      }
      setSelectedFields(initial);
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudieron extraer los campos del documento."));
    } finally {
      setIsExtracting(false);
    }
  }

  function toggleField(fieldName: string, field: FieldDefinition) {
    setSelectedFields((prev) => {
      const copy = { ...prev };
      if (copy[fieldName]) {
        delete copy[fieldName];
      } else {
        copy[fieldName] = field;
      }
      return copy;
    });
  }

  function updateFieldLabel(fieldName: string, newLabel: string) {
    setSelectedFields((prev) => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], label: newLabel },
    }));
  }

  function addManualField() {
    if (!newFieldName.trim() || !newFieldLabel.trim()) return;
    const snakeName = newFieldName.trim().toLowerCase().replace(/\s+/g, "_");
    setSelectedFields((prev) => ({ ...prev, [snakeName]: { name: snakeName, label: newFieldLabel.trim() } }));
    setNewFieldName("");
    setNewFieldLabel("");
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("El nombre de la plantilla es obligatorio.");
      return;
    }
    const fieldDefs = Object.values(selectedFields);
    if (fieldDefs.length === 0) {
      setError("Debes seleccionar al menos un campo para la plantilla.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await createTemplate({ name: name.trim(), description: description.trim(), field_definitions: fieldDefs });
      navigate("/templates");
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudo guardar la plantilla."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="page">
      <h1>Crear Nueva Plantilla</h1>
      {error && <Alert variant="error">{error}</Alert>}

      <section className="card">
        <h2>Paso 1: Sube un documento de ejemplo</h2>
        <p>El sistema leerá el documento y detectará automáticamente los campos disponibles.</p>
        <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" />
        <button type="button" onClick={handlePreview} disabled={isExtracting} style={{ marginTop: "0.5rem" }}>
          {isExtracting ? "Leyendo documento..." : "Detectar Campos"}
        </button>
      </section>

      {previewFields && (
        <section className="card">
          <h2>Paso 2: Selecciona los campos que quieres extraer</h2>
          <p>Marca los campos que te interesan, modifica sus nombres si es necesario, o agrega campos manualmente.</p>
          <table className="results-table">
            <thead>
              <tr>
                <th>Incluir</th>
                <th>Campo (nombre técnico)</th>
                <th>Etiqueta (editable)</th>
                <th>Valor detectado</th>
                <th>Confianza</th>
              </tr>
            </thead>
            <tbody>
              {previewFields.map((f) => (
                <tr key={f.name}>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!selectedFields[f.name]}
                      onChange={() => toggleField(f.name, { name: f.name, label: f.label })}
                    />
                  </td>
                  <td>{f.name}</td>
                  <td>
                    {selectedFields[f.name] ? (
                      <input
                        value={selectedFields[f.name].label}
                        onChange={(e) => updateFieldLabel(f.name, e.target.value)}
                        style={{ width: "100%" }}
                      />
                    ) : (
                      f.label
                    )}
                  </td>
                  <td>{String(f.value ?? "—")}</td>
                  <td>{f.confidence}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "end", marginTop: "1rem" }}>
            <div>
              <label htmlFor="newFieldName">Nombre técnico</label>
              <input id="newFieldName" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} placeholder="nombre_campo" />
            </div>
            <div>
              <label htmlFor="newFieldLabel">Etiqueta</label>
              <input id="newFieldLabel" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} placeholder="Nombre legible" />
            </div>
            <button type="button" onClick={addManualField}>Agregar campo</button>
          </div>

          {Object.keys(selectedFields).filter((k) => !previewFields.some((f) => f.name === k)).length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <strong>Campos manuales agregados:</strong>
              <ul>
                {Object.entries(selectedFields)
                  .filter(([k]) => !previewFields.some((f) => f.name === k))
                  .map(([k, v]) => (
                    <li key={k}>
                      {k}: {v.label}
                      <button type="button" onClick={() => toggleField(k, v)} style={{ marginLeft: "0.5rem" }}>
                        Quitar
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {previewFields && (
        <section className="card">
          <h2>Paso 3: Nombra y guarda la plantilla</h2>
          <form onSubmit={handleSave} className="payment-form" noValidate>
            <label htmlFor="templateName">Nombre de la plantilla</label>
            <input id="templateName" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Recibo Sedapal" />

            <label htmlFor="templateDesc">Descripción (opcional)</label>
            <input id="templateDesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Recibo de agua potable" />

            <p className="proration-note" style={{ marginTop: "0.5rem" }}>
              Campos seleccionados: {Object.keys(selectedFields).length}
            </p>

            <button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar Plantilla"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
