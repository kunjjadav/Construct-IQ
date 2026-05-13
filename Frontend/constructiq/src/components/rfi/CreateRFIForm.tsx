import { useState } from "react";
import { createRFI } from "../../api/rfi";
import Button from "../ui/Button";

interface CreateRFIFormProps {
  projectId: string | number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateRFIForm({
  projectId,
  onSuccess,
  onCancel,
}: CreateRFIFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createRFI({
        project: projectId,
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date || null,
      });
      onSuccess();
    } catch (err: unknown) {
      console.error("Failed to create RFI:", err);
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(
        axiosErr?.response?.data?.detail ||
          "Failed to submit the Request for Information. Please try again.",
      );
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
          Raise New RFI
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Submit a formal Request for Information to the project Architect or
          Agent.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 bg-red-900/20 border border-red-500/50 rounded-md text-red-500 text-sm"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            Subject / Title *
          </span>
          <input
            type="text"
            required
            autoFocus
            className="px-3 py-2 bg-[var(--color-bg-interactive)] border border-[var(--color-border-subtle)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-border-focus)] transition-colors"
            placeholder="E.g., Clarification on Level 2 beam specifications"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            Question / Description *
          </span>
          <textarea
            required
            rows={5}
            className="px-3 py-2 bg-[var(--color-bg-interactive)] border border-[var(--color-border-subtle)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-border-focus)] transition-colors resize-y"
            placeholder="Provide architectural or engineering context..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            Requested Due Date (Optional)
          </span>
          <input
            type="date"
            className="px-3 py-2 bg-[var(--color-bg-interactive)] border border-[var(--color-border-subtle)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-border-focus)] transition-colors w-full sm:w-auto"
            value={formData.due_date}
            onChange={(e) =>
              setFormData({ ...formData, due_date: e.target.value })
            }
          />
        </label>
      </div>

      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={isSubmitting || !formData.title || !formData.description}
        >
          {isSubmitting ? "Submitting..." : "Submit RFI"}
        </Button>
      </div>
    </form>
  );
}
