
import { create } from "zustand";
import api from "../api/axiosInstance";
import { toast } from "../components/ui/Toast";
import {
  enqueueItem,
  getPendingItems,
  removeItem,
  incrementRetry,
  deadLetter,
  markInFlight,
  countPending,
  getDeadLetterItems,
  type SyncRecord,
} from "../lib/idb";

export type SyncMethod = "POST" | "PATCH" | "PUT" | "DELETE";

const MAX_SYNC_RETRIES = 5;

export type SyncItem = SyncRecord;

interface SyncState {
  pendingCount: number;
  deadLetterCount: number;
  networkStatus: boolean;
  isSyncing: boolean;

  setNetworkStatus: (isOnline: boolean) => void;
  enqueueSyncItem: (
    url: string,
    method: SyncMethod,
    payload: Record<string, unknown>,
  ) => Promise<void>;
  resolveSyncQueue: () => Promise<void>;
  refreshCounts: () => Promise<void>;
  getDeadLetters: () => Promise<SyncRecord[]>;
}

export const useSyncStore = create<SyncState>()((set, get) => ({
  pendingCount: 0,
  deadLetterCount: 0,
  networkStatus: typeof navigator !== "undefined" ? navigator.onLine : true,
  isSyncing: false,

  refreshCounts: async () => {
    try {
      const pending = await countPending();
      const deadLetters = await getDeadLetterItems();
      set({ pendingCount: pending, deadLetterCount: deadLetters.length });
    } catch (err) {
      console.error("[SyncStore] Failed to refresh counts from IDB:", err);
    }
  },

  setNetworkStatus: (isOnline) => {
    set({ networkStatus: isOnline });
    if (isOnline) {
      get().resolveSyncQueue();
    }
  },

  enqueueSyncItem: async (url, method, payload) => {
    try {
      await enqueueItem(url, method, payload);
      await get().refreshCounts();
      const count = get().pendingCount;
      toast(`Offline: Item queued for sync (${count} total)`, "warning");
    } catch (err) {
      console.error("[SyncStore] Failed to enqueue item to IDB:", err);
      toast("Failed to save offline data. Please try again.", "error");
    }
  },

  resolveSyncQueue: async () => {
    const { isSyncing } = get();
    if (isSyncing) return;

    let items: SyncRecord[];
    try {
      items = await getPendingItems();
    } catch (err) {
      console.error("[SyncStore] Failed to read pending items from IDB:", err);
      return;
    }

    if (items.length === 0) return;

    set({ isSyncing: true });
    toast("Data connection restored. Syncing queue...", "info");

    let successCount = 0;
    let failCount = 0;

    for (const item of items) {
      try {
        await markInFlight(item.id);

        switch (item.method) {
          case "POST":
            await api.post(item.url, item.payload);
            break;
          case "PATCH":
            await api.patch(item.url, item.payload);
            break;
          case "PUT":
            await api.put(item.url, item.payload);
            break;
          case "DELETE":
            await api.delete(item.url);
            break;
        }

        await removeItem(item.id);
        successCount++;
      } catch (error: unknown) {
        console.error("[SyncStore] Failed to sync item", item.id, error);

        const err = error as { response?: { status: number } };

        if (
          err.response &&
          err.response.status >= 400 &&
          err.response.status < 500 &&
          err.response.status !== 429
        ) {
          await deadLetter(item.id);
        } else if ((item.retries ?? 0) >= MAX_SYNC_RETRIES) {
          await deadLetter(item.id);
        } else {
          await incrementRetry(item.id);
        }
        failCount++;
      }
    }

    set({ isSyncing: false });
    await get().refreshCounts();

    if (failCount === 0) {
      toast(`All ${successCount} offline items synchronized!`, "success");
    } else {
      toast(
        `Synced ${successCount}, failed ${failCount}. Will retry later.`,
        "error",
      );
    }
  },

  getDeadLetters: async () => {
    return getDeadLetterItems();
  },
}));

useSyncStore.getState().refreshCounts();

window.addEventListener("online", () =>
  useSyncStore.getState().setNetworkStatus(true),
);
window.addEventListener("offline", () =>
  useSyncStore.getState().setNetworkStatus(false),
);
