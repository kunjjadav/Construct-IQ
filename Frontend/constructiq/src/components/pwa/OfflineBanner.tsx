
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw, AlertTriangle } from "lucide-react";
import { useSyncStore } from "../../store/useSyncStore";

export default function OfflineBanner() {
  const { networkStatus, isSyncing, pendingCount, deadLetterCount } =
    useSyncStore();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!networkStatus) setDismissed(false);
  }, [networkStatus]);

  const showBanner = !networkStatus && !dismissed;
  const showSyncingBanner = networkStatus && isSyncing;
  const showDeadLetterBanner =
    networkStatus && !isSyncing && deadLetterCount > 0;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          key="offline-banner"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative z-[9999] flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.35 0.15 25), oklch(0.30 0.12 30))",
            borderBottom: "1px solid oklch(0.45 0.15 25 / 0.4)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <WifiOff className="w-4.5 h-4.5 text-white" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-400 animate-ping opacity-75" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-400" />
            </div>
            <div>
              <span className="text-white">You're offline</span>
              {pendingCount > 0 && (
                <span className="ml-2 text-white/70">
                  · {pendingCount} item{pendingCount !== 1 ? "s" : ""} queued
                  for sync
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {showSyncingBanner && (
        <motion.div
          key="syncing-banner"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative z-[9999] flex items-center justify-center gap-3 px-4 py-2 text-sm font-medium"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.35 0.12 200), oklch(0.30 0.10 210))",
            borderBottom: "1px solid oklch(0.50 0.12 200 / 0.3)",
          }}
        >
          <RefreshCw className="w-4 h-4 text-cyan-300 animate-spin" />
          <span className="text-cyan-100">Syncing offline data...</span>
        </motion.div>
      )}

      {showDeadLetterBanner && (
        <motion.div
          key="dead-letter-banner"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative z-[9999] flex items-center justify-between gap-3 px-4 py-2 text-sm font-medium"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.35 0.12 70), oklch(0.30 0.10 75))",
            borderBottom: "1px solid oklch(0.50 0.12 70 / 0.3)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-300" />
            <span className="text-amber-100">
              {deadLetterCount} item{deadLetterCount !== 1 ? "s" : ""} failed to
              sync and need attention
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
