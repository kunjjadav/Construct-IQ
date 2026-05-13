import { useState, useRef } from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { uploadPhoto } from "../../api/photos";
import { toast } from "../ui/Toast"; // Fix casing via vite if needed

import Input from "../ui/Input";
import Button from "../ui/Button";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

interface PhotoUploadProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PhotoUpload({ onSuccess, onCancel }: PhotoUploadProps) {
  const currentProject = useProjectStore((state) => state.currentProject);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCaptureGPS = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        () => resolve(null), // Timeout or denied
        { timeout: 5000, maximumAge: 10000 },
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !file) return;
    setIsSubmitting(true);

    try {
      const coords = await handleCaptureGPS();
      await uploadPhoto(
        currentProject.id,
        file,
        caption,
        coords?.lat,
        coords?.lng,
      );
      toast("Photo successfully uploaded to S3 context.", "success");
      onSuccess();
    } catch (error: unknown) {
      console.error("Photo upload failed", error);
      toast(
        "Upload failed. Image may exceed 20MB limit or connection is unstable.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold tracking-tight uppercase text-[var(--color-text-muted)]">
          Site Asset (Photo)
        </label>

        <div
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload site photo — click to select or use camera"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              fileInputRef.current?.click();
          }}
          className="w-full h-40 border-2 border-dashed border-[var(--color-border-strong)] rounded-[var(--radius-xl)] bg-[var(--color-bg-interactive)] hover:bg-[var(--color-bg-surface)] transition-colors flex flex-col items-center justify-center cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-accent-cyan)]"
        >
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <svg
                aria-hidden="true"
                focusable="false"
                className="w-8 h-8 text-[var(--color-accent-emerald)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {file.name}
              </span>
              <span className="text-xs">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg
                aria-hidden="true"
                focusable="false"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm font-medium">
                Capture or drop image here
              </span>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/jpeg, image/png, image/heic"
          capture="environment" // Mobile: Forces the rear-facing camera to open immediately
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected && selected.size > MAX_FILE_SIZE) {
              toast(
                `Image exceeds 20MB limit (${(selected.size / 1024 / 1024).toFixed(1)}MB).`,
                "error",
              );
              return;
            }
            setFile(selected || null);
          }}
          required={!file}
        />
      </div>

      <Input
        label="Contextual Caption"
        placeholder="e.g. Concrete placement on level 4 grid A"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        maxLength={255}
        required
      />

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
          disabled={!file}
        >
          Upload Metadata & Image
        </Button>
      </div>
    </form>
  );
}
