import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteTemplate, listTemplates, type TemplateRead } from "../../api/templates";
import { Alert } from "../../components/Alert";

export function TemplatesListPage() {
  const [templates, setTemplates] = useState<TemplateRead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function load() {
    listTemplates().then(setTemplates).catch(() => setError("No se pudieron cargar las plantillas."));
  }

  useEffect(load, []);

  async function confirmDelete(id: string) {
    await deleteTemplate(id);
    setPendingDeleteId(null);
    load();
  }

  const globalTemplates = templates.filter((t) => t.user_id === null);
  const myTemplates = templates.filter((t) => t.user_id !== null);

  return (
    <div className="page">
      <h1>Plantillas de Documento</h1>
      {error && <Alert variant="error">{error}</Alert>}

      <Link to="/templates/new" className="button-link">
        Crear Nueva Plantilla
      </Link>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h2>Catálogo Global</h2>
        <p className="proration-note">Plantillas predefinidas disponibles para todos los usuarios.</p>
        {globalTemplates.length === 0 && <p>No hay plantillas globales.</p>}
        <ul className="document-list">
          {globalTemplates.map((tpl) => (
            <li key={tpl.id}>
              <strong>{tpl.name}</strong> — {tpl.field_definitions.length} campos — {tpl.description}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Mis Plantillas Personalizadas</h2>
        {myTemplates.length === 0 && <p>Aún no has creado plantillas personalizadas.</p>}
        <ul className="document-list">
          {myTemplates.map((tpl) => (
            <li key={tpl.id}>
              <strong>{tpl.name}</strong> — {tpl.field_definitions.length} campos
              <Link to={`/templates/${tpl.id}/edit`} style={{ marginLeft: "0.5rem" }}>
                Editar
              </Link>
              {pendingDeleteId === tpl.id ? (
                <span className="confirm-inline">
                  ¿Eliminar?
                  <button type="button" onClick={() => confirmDelete(tpl.id)}>Confirmar</button>
                  <button type="button" onClick={() => setPendingDeleteId(null)}>Cancelar</button>
                </span>
              ) : (
                <button type="button" onClick={() => setPendingDeleteId(tpl.id)}>Eliminar</button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
