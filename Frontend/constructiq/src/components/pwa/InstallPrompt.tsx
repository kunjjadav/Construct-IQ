
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Wifi } from "lucide-react";

let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;

      const dismissedAt = localStorage.getItem("constructiq_pwa_dismissed");
      if (dismissedAt) {
        const daysSince =
          (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) return; // Don't nag more than once a week
      }

      setTimeout(() => setShowPrompt(true), 3000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      deferredPrompt = null;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    deferredPrompt = null;
  }, []);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem("constructiq_pwa_dismissed", Date.now().toString());
  }, []);

  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 200, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed bottom-4 left-4 right-4 z-[9999] sm:left-auto sm:right-6 sm:bottom-6 sm:w-[400px]"
        >
          <div
            className="relative rounded-2xl p-5 shadow-2xl border border-[var(--color-border-subtle)]"
            style={{
              background:
                "linear-gradient(145deg, oklch(0.22 0.02 200), oklch(0.18 0.01 285))",
              backdropFilter: "blur(24px)",
            }}
          >
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-interactive)] transition-colors cursor-pointer"
              aria-label="Dismiss install prompt"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4">
              <div
                className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.50 0.12 200), oklch(0.45 0.10 150))",
                }}
              >
                <Smartphone className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                  Install ConstructIQ
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-3">
                  Add to your home screen for instant access, offline field
                  logging, and push notifications.
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {[
                    {
                      icon: <Wifi className="w-3 h-3" />,
                      text: "Works offline",
                    },
                    {
                      icon: <Download className="w-3 h-3" />,
                      text: "No app store",
                    },
                  ].map((feat) => (
                    <span
                      key={feat.text}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-[var(--color-accent-cyan)]"
                      style={{ background: "oklch(0.72 0.08 200 / 0.12)" }}
                    >
                      {feat.icon}
                      {feat.text}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleInstall}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.55 0.15 200), oklch(0.50 0.12 150))",
                    }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Install App
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
