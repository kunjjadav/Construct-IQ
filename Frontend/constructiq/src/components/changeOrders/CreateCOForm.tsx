import { useState } from "react";
import { createCO, submitCO } from "../../api/changeOrders";
import { toast } from "../ui/Toast";
import Button from "../ui/Button";

interface CreateCOFormProps {
  projectId: string | number;
  onSuccess: () => void;
  onCancel: () => void;
}

const REASON_CODES = [
  { value: "", label: "Select a reason..." },
  { value: "DESIGN_CHANGE", label: "Design Change" },
  { value: "UNFORESEEN_CONDITION", label: "Unforeseen Site Condition" },
  { value: "CLIENT_REQUEST", label: "Client-Requested Modification" },
  { value: "REGULATORY", label: "Regulatory / Code Compliance" },
  { value: "VALUE_ENGINEERING", label: "Value Engineering" },
  { value: "MATERIAL_SUBSTITUTION", label: "Material Substitution" },
  { value: "SCOPE_ADDITION", label: "Scope Addition" },
  { value: "SCOPE_REDUCTION", label: "Scope Reduction" },
  { value: "OTHER", label: "Other" },
];

export default function CreateCOForm({
  projectId,
  onSuccess,
  onCancel,
}: CreateCOFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reason_code: "",
    cost_impact: "",
    schedule_impact_days: "",
  });

  const handleSubmit = async (e: React.FormEvent, submitForReview: boolean) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await createCO({
        project: projectId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        reason_code: formData.reason_code,
        cost_impact: formData.cost_impact || "0.00",
        schedule_impact_days: parseInt(formData.schedule_impact_days) || 0,
      });

      if (submitForReview) {
        await submitCO(created.id);
        toast(
          "Change Order created and submitted for client approval.",
          "success",
        );
      } else {
        toast("Change Order saved as draft.", "success");
      }

      onSuccess();
    } catch (err: unknown) {
      console.error("Failed to create Change Order:", err);
      const axiosErr = err as {
        response?: { data?: { detail?: string; project?: string[] } };
      };
      const detail =
        axiosErr?.response?.data?.detail ||
        axiosErr?.response?.data?.project?.[0];
      setError(detail || "Failed to create Change Order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
    await handleSubmit(syntheticEvent, false);
  };

  const isValid = formData.title.trim() && formData.description.trim();

  return (
    <form
      onSubmit={(e) => handleSubmit(e, true)}
      className="flex flex-col gap-6 p-6 bg-[var(--color-bg-base)]"
    >
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Raise Change Order
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Document a formal scope, budget, or schedule change for client
          authorization.
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
            Title *
          </span>
          <input
            type="text"
            required
            autoFocus
            className="px-3 py-2 bg-[var(--color-bg-interactive)] border border-[var(--color-border-subtle)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-border-focus)] transition-colors"
            placeholder="E.g., Add drainage system to Level B2 parking"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            Detailed Justification *
          </span>
          <textarea
            required
            rows={5}
            className="px-3 py-2 bg-[var(--color-bg-interactive)] border border-[var(--color-border-subtle)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-border-focus)] transition-colors resize-y"
            placeholder="Describe why this change is required, what it affects, and what happens if it's not approved..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            Reason Code
          </span>
          <select
            className="px-3 py-2 bg-[var(--color-bg-interactive)] border border-[var(--color-border-subtle)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-border-focus)] transition-colors"
            value={formData.reason_code}
            onChange={(e) =>
              setFormData({ ...formData, reason_code: e.target.value })
            }
          >
            {REASON_CODES.map((rc) => (
              <option key={rc.value} value={rc.value}>
                {rc.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              Cost Impact ($)
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              className="px-3 py-2 bg-[var(--color-bg-interactive)] border border-[var(--color-border-subtle)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-border-focus)] transition-colors"
              placeholder="0.00"
              value={formData.cost_impact}
              onChange={(e) =>
                setFormData({ ...formData, cost_impact: e.target.value })
              }
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              Schedule Impact (Days)
            </span>
            <input
              type="number"
              min="0"
              className="px-3 py-2 bg-[var(--color-bg-interactive)] border border-[var(--color-border-subtle)] rounded-md text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-border-focus)] transition-colors"
              placeholder="0"
              value={formData.schedule_impact_days}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  schedule_impact_days: e.target.value,
                })
              }
            />
          </label>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="secondary"
          type="button"
          disabled={isSubmitting || !isValid}
          onClick={handleSaveDraft}
        >
          {isSubmitting ? "Saving..." : "Save as Draft"}
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? "Submitting..." : "Submit for Client Review"}
        </Button>
      </div>
    </form>
  );
}
