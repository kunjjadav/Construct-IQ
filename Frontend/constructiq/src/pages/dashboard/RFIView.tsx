import { useEffect, useState, useCallback } from "react";
import type { RFIRecord } from "../../api/rfi";
import api from "../../api/axiosInstance";
import Spinner from "../../components/ui/Spinner";
import RFIQuestionNode from "../../components/rfi/RFIQuestionNode";
import RFIAnswerForm from "../../components/rfi/RFIAnswerForm";
import Button from "../../components/ui/Button";
import { approveRFI } from "../../api/rfi";
import { useAuthStore } from "../../store/useAuthStore";
import { toast } from "../../components/ui/Toast"; // Fix path via Vite aliasing if needed, here it's fine
import { CheckCircle } from "lucide-react";

interface RFIViewProps {
  rfiId: string;
  onResolved: () => void;
}

export default function RFIView({ rfiId, onResolved }: RFIViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [rfi, setRfi] = useState<RFIRecord | null>(null);
  const user = useAuthStore((state) => state.user);

  const fetchRFI = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/rfi/${rfiId}/`);
      setRfi(response.data);
    } catch (error) {
      console.error("Failed to load single RFI", error);
    } finally {
      setIsLoading(false);
    }
  }, [rfiId]);

  useEffect(() => {
    fetchRFI();
  }, [fetchRFI]);

  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-[var(--color-text-muted)] gap-4">
        <Spinner size="lg" />
        <span className="text-xs uppercase font-bold tracking-widest animate-pulse">
          Decrypting thread...
        </span>
      </div>
    );
  }

  if (!rfi) {
    return (
      <div className="p-8 text-center text-[var(--color-text-muted)]">
        RFI could not be located on server.
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full relative pb-12">
      <div className="relative z-10">
        <RFIQuestionNode rfi={rfi} />
      </div>

      <div className="ml-10 w-0.5 h-12 bg-gradient-to-b from-[var(--color-border-subtle)] to-[var(--color-border-strong)] relative z-0 opacity-50 my-2" />

      <div className="relative z-10 w-full pl-6 sm:pl-10">
        <RFIAnswerForm
          rfiId={rfi.id}
          existingAnswer={rfi.response || null}
          onAnswerSaved={() => {
            fetchRFI(); // Re-hydrate to lock the UI instantly
            onResolved(); // Signal the parent layout to drop the priority flag
          }}
        />

        {rfi.status === "ANSWERED" &&
          String(user?.id) === String(rfi.submitted_by) && (
            <div className="mt-6 flex justify-end">
              <Button
                variant="primary"
                isLoading={isApproving}
                onClick={async () => {
                  setIsApproving(true);
                  try {
                    await approveRFI(rfi.id);
                    toast(
                      "RFI has been successfully closed and approved.",
                      "success",
                    );
                    fetchRFI();
                    onResolved();
                  } catch (err: unknown) {
                    console.error("Failed to approve RFI:", err);
                    toast("Failed to approve and close the RFI.", "error");
                  } finally {
                    setIsApproving(false);
                  }
                }}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Approve & Close RFI
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
