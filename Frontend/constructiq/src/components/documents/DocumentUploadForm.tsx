import { useState } from "react";
import { uploadDocument } from "../../api/documents";
import { toast } from "../ui/Toast";
import Button from "../ui/Button";

interface DocumentUploadFormProps {
  projectId: string | number;
  onSuccess: () => void;
  onCancel: () => void;
}

const FILE_TYPES = [
  { value: "PDF", label: "PDF" },
  { value: "DWG", label: "AutoCAD Drawing (.dwg)" },
  { value: "IFC", label: "BIM / IFC" },
  { value: "DOCX", label: "Word Document" },
  { value: "XLSX", label: "Excel Spreadsheet" },
  { value: "IMAGE", label: "Image" },
  { value: "OTHER", label: "Other" },
];

export default function DocumentUploadForm({
  projectId,
  onSuccess,
  onCancel,
}: DocumentUploadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [fileType, setFileType] = useState("OTHER");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title.trim()) return;

    setIsSubmitting(true);
    try {
      await uploadDocument(
        String(projectId),
        selectedFile,
        title.trim(),
        fileType,
      );
      toast(
        "Document uploaded successfully. Version control applied.",
        "success",
      );
      onSuccess();
    } catch (err: unknown) {
      console.error("Failed to upload document:", err);
      toast("Failed to upload document. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 p-6 bg-[var(--color-bg-base)]"
    >
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Upload Document
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Upload blueprints, specs, contracts, or any project document.
          Versioning is automatic — re-uploading with the same title creates a
          new version.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            Document Title *
          </span>
          <input
            type="text"
            required
            autoFocus
            className="px-3 py-2 bg-[var(--color-bg-interactive)] border border-[var(--color-border-subtle)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-border-focus)] transition-colors"
            placeholder="E.g., Foundation Structural Drawings"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            File Type
          </span>
          <select
            className="px-3 py-2 bg-[var(--color-bg-interactive)] border border-[var(--color-border-subtle)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-border-focus)] transition-colors"
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
          >
            {FILE_TYPES.map((ft) => (
              <option key={ft.value} value={ft.value}>
                {ft.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            File *
          </span>
          <div className="relative">
            <input
              type="file"
              required
              className="block w-full text-sm text-[var(--color-text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-accent-blue)] file:text-white hover:file:opacity-80 file:cursor-pointer cursor-pointer"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </div>
          {selectedFile && (
            <span className="text-xs text-[var(--color-text-muted)]">
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          )}
        </label>
      </div>

      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={isSubmitting || !selectedFile || !title.trim()}
        >
          {isSubmitting ? "Uploading..." : "Upload Document"}
        </Button>
      </div>
    </form>
  );
}
