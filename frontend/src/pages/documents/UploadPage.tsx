import { useRef, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { uploadBatch, uploadDocument } from "../../api/documents";
import { extractErrorMessage } from "../../api/client";
import { Alert } from "../../components/Alert";

const SUPPORTED_TYPES = [".jpg", ".jpeg", ".png", ".pdf", ".zip"];

export function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingMode, setProcessingMode] = useState<"express" | "almacenado">("express");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  function validateAndSetFile(file: File) {
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!SUPPORTED_TYPES.includes(extension)) {
      setError(`Formato no soportado: ${extension}. Formatos válidos: JPEG, PNG, PDF, ZIP.`);
      return;
    }
    setError(null);
    setSelectedFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) validateAndSetFile(file);
  }

  async function handleProcess() {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    setStatusMessage("Procesando su documento...");

    try {
      const isZip = selectedFile.name.toLowerCase().endsWith(".zip");
      if (isZip) {
        const result = await uploadBatch(selectedFile, processingMode);
        setStatusMessage(`Lote procesado: ${result.total_documents} documento(s).`);
        if (result.document_ids[0]) navigate(`/documents/${result.document_ids[0]}`);
      } else {
        const result = await uploadDocument(selectedFile, processingMode);
        navigate(`/documents/${result.id}`);
      }
    } catch (err) {
      setError(extractErrorMessage(err, "No se pudo procesar el documento."));
      setStatusMessage(null);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="page">
      <h1>Carga de Documentos</h1>

      <section className="card">
        <h2>Modo de Procesamiento</h2>
        <label className="radio-label">
          <input
            type="radio"
            name="processingMode"
            checked={processingMode === "express"}
            onChange={() => setProcessingMode("express")}
          />
          <strong>Express (sin persistencia)</strong> — el resultado sólo está disponible durante tu sesión activa; imágenes y
          datos en bruto se destruyen de inmediato.
        </label>
        <label className="radio-label">
          <input
            type="radio"
            name="processingMode"
            checked={processingMode === "almacenado"}
            onChange={() => setProcessingMode("almacenado")}
          />
          <strong>Almacenado (retención de 5 días)</strong> — imágenes y datos extraídos se conservan 5 días y luego se
          eliminan físicamente.
        </label>
      </section>

      <section
        className="dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
      >
        <p>Arrastra y suelta un archivo aquí, o</p>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Seleccionar Archivo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept={SUPPORTED_TYPES.join(",")}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) validateAndSetFile(file);
          }}
        />
        {selectedFile && (
          <p>
            Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </section>

      {error && <Alert variant="error">{error}</Alert>}
      {statusMessage && <Alert variant="info">{statusMessage}</Alert>}

      <button type="button" disabled={!selectedFile || isUploading} onClick={handleProcess}>
        {isUploading ? "Procesando..." : "Procesar Documentos"}
      </button>
    </div>
  );
}
