import { useState } from "react";
import { answerRFI } from "../../api/rfi";
import { toast } from "../ui/Toast"; // Fix visual casing via vite
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import { useAuthStore } from "../../store/useAuthStore";

interface RFIAnswerFormProps {
  rfiId: string;
  existingAnswer: string | null;
  onAnswerSaved: () => void;
}

export default function RFIAnswerForm({
  rfiId,
  existingAnswer,
  onAnswerSaved,
}: RFIAnswerFormProps) {
  const user = useAuthStore((state) => state.user);
  const [answerContent, setAnswerContent] = useState(existingAnswer || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLocked = existingAnswer !== null;

  const isAuthorizedToAnswer =
    user?.role === "SITE_OFFICER" ||
    user?.role === "AGENT" ||
    user?.role === "ADMIN";

  const handleSubmit = async () => {
    if (!answerContent.trim()) {
      toast("You cannot submit an empty resolution.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await answerRFI(rfiId, answerContent);
      toast(
        "Legal RFI resolution successfully recorded and transmitted to field team.",
        "success",
      );
      onAnswerSaved();
    } catch (err: unknown) {
      console.error("Failed to record RFI answer:", err);
      toast("Failed to record answer. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`flex flex-col gap-4 border border-[var(--color-border-strong)] p-6 rounded-[var(--radius-xl)] relative overflow-hidden transition-colors ${isLocked ? "bg-[var(--color-bg-interactive)] border-[var(--color-accent-cyan)] shadow-[0_0_15px_rgba(4,217,255,0.05)]" : "bg-[var(--color-bg-elevated)]"}`}
    >
      {isLocked && (
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <svg
            aria-hidden="true"
            focusable="false"
            className="w-24 h-24 text-[var(--color-accent-cyan)]"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.757-2.243-5-5-5zm-3 5c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm3 11a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </div>
      )}

      <div className="flex items-center gap-3 mb-2 relative z-10">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ${isLocked ? "bg-[var(--color-accent-cyan)]" : "bg-[var(--color-text-muted)]"}`}
        >
          <svg
            aria-hidden="true"
            focusable="false"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div>
          <span className="text-sm font-semibold tracking-tight uppercase text-[var(--color-text-primary)]">
            Architectural Resolution
          </span>
          {isLocked && (
            <div className="text-xs text-[var(--color-accent-cyan)] font-medium">
              Binding Signature Registered
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 w-full pl-11">
        {isLocked ? (
          <p className="text-[var(--color-text-primary)] text-sm whitespace-pre-wrap leading-relaxed">
            {existingAnswer}
          </p>
        ) : isAuthorizedToAnswer ? (
          <div className="flex flex-col gap-4 w-full">
            <textarea
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
              placeholder="Provide exact execution details, attach dimension variances, or authorize deviation..."
              className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-xl p-4 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-cyan)] min-h-[160px] text-[var(--color-text-primary)] transition-shadow"
              maxLength={10000}
            />
            <div className="flex justify-between items-center bg-[var(--color-bg-surface)] p-3 rounded-lg border border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-xs font-semibold px-2">
                <Avatar
                  name={`${user?.first_name} ${user?.last_name}`}
                  size="xs"
                />
                Signing electronically as {user?.first_name} {user?.last_name}
              </div>
              <Button
                onClick={handleSubmit}
                isLoading={isSubmitting}
                variant="primary"
              >
                Broadcast Resolution
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[var(--color-bg-surface)] border border-dashed border-[var(--color-border-strong)] rounded-xl flex flex-col items-center justify-center text-[var(--color-text-muted)] gap-2 min-h-[120px]">
            <svg
              aria-hidden="true"
              focusable="false"
              className="w-8 h-8 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm">
              Awaiting formal resolution from the project architect or agent.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
