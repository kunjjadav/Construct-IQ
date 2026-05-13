import React, { useState } from "react";
import {
  createMaintenance,
  type MaintenancePriority,
} from "../../api/maintenance";
import Button from "../ui/Button";

interface CreateMaintenanceFormProps {
  projectId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateMaintenanceForm({
  projectId,
  onSuccess,
  onCancel,
}: CreateMaintenanceFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as MaintenancePriority,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createMaintenance({
        project: projectId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
      });
      onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Issue Title
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Broken Pipe in Sector 3"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-lg px-4 py-2 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Priority Level
          </label>
          <select
            value={formData.priority}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                priority: e.target.value as MaintenancePriority,
              }))
            }
            className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-lg px-4 py-2 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)]"
          >
            <option value="LOW">Low - Routine fix</option>
            <option value="MEDIUM">Medium - Needs attention</option>
            <option value="HIGH">High - Urgent repair</option>
            <option value="CRITICAL">
              Critical - Safety risk / Work stoppage
            </option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Issue Description
          </label>
          <textarea
            required
            rows={5}
            placeholder="Describe the issue in detail, location, and any immediate hazards..."
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-lg px-4 py-2 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)] resize-none"
          />
        </div>
      </div>

      <div className="p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex justify-end gap-3 shrink-0">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={loading || !formData.title || !formData.description}
        >
          {loading ? "Submitting..." : "Submit Request"}
        </Button>
      </div>
    </form>
  );
}
