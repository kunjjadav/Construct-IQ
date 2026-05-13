import { registerSW } from "virtual:pwa-register";

export function initServiceWorker() {
  if ("serviceWorker" in navigator) {
    const updateSW = registerSW({
      onNeedRefresh() {
        console.info("[SW] New version available. Auto-updating...");
        updateSW(true);
      },
      onOfflineReady() {
        console.info("[SW] App is ready for offline use.");
      },
      onRegisterError(error) {
        console.error("[SW] Registration error:", error);
      },
    });
  }
}
