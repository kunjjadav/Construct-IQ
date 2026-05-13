import { useState, useEffect } from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { createLog } from "../../api/weeklyLogs";
import { listPhotos, type PhotoRecord } from "../../api/photos";
import { useSyncStore } from "../../store/useSyncStore";
import { toast } from "../ui/Toast";

import Input from "../ui/Input";
import Button from "../ui/Button";
import SkeletonLoader from "../ui/SkeletonLoader";

interface WeeklyLogFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function WeeklyLogForm({
  onSuccess,
  onCancel,
}: WeeklyLogFormProps) {
  const currentProject = useProjectStore((state) => state.currentProject);
  const isOnline = useSyncStore((state) => state.networkStatus);
  const enqueueSyncItem = useSyncStore((state) => state.enqueueSyncItem);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // Today default
  const [weather, setWeather] = useState("");
  const [crewCount, setCrewCount] = useState("");
  const [budgetUsed, setBudgetUsed] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [availablePhotos, setAvailablePhotos] = useState<PhotoRecord[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(
    new Set(),
  );
  const [isPhotosLoading, setIsPhotosLoading] = useState(true);

  useEffect(() => {
    if (currentProject) {
      setIsPhotosLoading(true);
      listPhotos(currentProject.id)
        .then((data) => {
          setAvailablePhotos(data);
        })
        .catch((err) => {
          console.error("Failed to load photos", err);
        })
        .finally(() => {
          setIsPhotosLoading(false);
        });
    }
  }, [currentProject]);

  const togglePhoto = (id: string) => {
    const newSelected = new Set(selectedPhotoIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPhotoIds(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;
    setIsSubmitting(true);

    const payload = {
      project: currentProject.id,
      week_start_date: date,
      weather: weather,
      crew_count: parseInt(crewCount) || 0,
      budget_used: budgetUsed || "0.00",
      notes,
      photo_ids: Array.from(selectedPhotoIds),
    };

    try {
      if (!isOnline) {
        enqueueSyncItem("/api/weekly-logs/", "POST", payload);
      } else {
        await createLog(payload);
        toast("Weekly log securely submitted.", "success");
      }
      onSuccess();
    } catch (error: unknown) {
      console.error("Failed to submit log", error);
      toast("Error submitting log. Please retry.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {!isOnline && (
        <div className="bg-[var(--color-accent-amber-dim)] border border-[var(--color-accent-amber)] p-3 rounded-[var(--radius-md)] text-sm text-[var(--color-accent-amber)] font-medium flex items-center gap-2">
          <svg
            aria-hidden="true"
            focusable="false"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          You are currently offline. This log will queue and transmit
          automatically when a connection is restored.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Input
          label="Week Start Date (Monday)"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <Input
          label="Total Crew Headcount"
          type="number"
          placeholder="e.g. 14"
          min="0"
          value={crewCount}
          onChange={(e) => setCrewCount(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Input
          label="Overall Weather Conditions"
          placeholder="e.g. Mixed, clear mostly"
          value={weather}
          onChange={(e) => setWeather(e.target.value)}
          required
        />
        <Input
          label="Budget Used (USD)"
          type="number"
          step="0.01"
          placeholder="e.g. 5000.00"
          min="0"
          value={budgetUsed}
          onChange={(e) => setBudgetUsed(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5 border-t border-[var(--color-border-subtle)] pt-4">
        <label className="text-sm font-semibold tracking-tight uppercase text-[var(--color-text-muted)]">
          Attach Field Photos
        </label>
        {isPhotosLoading ? (
          <SkeletonLoader type="card" count={3} />
        ) : availablePhotos.length > 0 ? (
          <div className="flex flex-wrap gap-3 max-h-48 overflow-y-auto mt-2">
            {availablePhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => togglePhoto(photo.id)}
                className={`relative w-24 h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedPhotoIds.has(photo.id) ? "border-[var(--color-accent-teal)] ring-2 ring-[var(--color-accent-teal)] ring-offset-2" : "border-transparent opacity-80 hover:opacity-100"}`}
              >
                <img
                  src={photo.image || undefined}
                  className="w-full h-full object-cover"
                  alt="site"
                />
                {selectedPhotoIds.has(photo.id) && (
                  <div className="absolute top-1 right-1 bg-[var(--color-accent-teal)] text-black rounded-full p-0.5">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-[var(--color-text-muted)]">
            No recent photos uploaded. Upload photos from Reality Capture first
            to attach them here.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 mt-2">
        <label
          htmlFor="notes"
          className="text-sm font-semibold tracking-tight uppercase text-[var(--color-text-muted)]"
        >
          Weekly Recap & Production Notes
        </label>
        <textarea
          id="notes"
          rows={6}
          maxLength={10000}
          className="w-full bg-[var(--color-bg-interactive)] border border-[var(--color-border-strong)] rounded-lg py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] transition-shadow text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] resize-y relative z-10"
          placeholder="Document specific progress, material delays, or incidents here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          required
        />
      </div>

      <div className="flex gap-4 pt-4 border-t border-[var(--color-border-subtle)] mt-2">
        <Button
          type="button"
          variant="ghost"
          className="flex-1"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          isLoading={isSubmitting}
        >
          {isOnline ? "Submit Weekly Log" : "Queue Synchronization"}
        </Button>
      </div>
    </form>
  );
}
