import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  FileSignature,
  Info,
  AlertTriangle,
  Settings,
  FileSearch,
  X,
} from "lucide-react";
import { useNotificationStore } from "../../store/useNotificationStore";
import { markRead, markAllRead } from "../../api/notifications";
import type { NotificationType } from "../../api/notifications";

const getIconForType = (type: NotificationType) => {
  switch (type) {
    case "RFI_ASSIGNED":
    case "RFI_ANSWERED":
      return <FileSearch className="w-5 h-5 text-amber-500" />;
    case "CO_PENDING":
    case "CO_APPROVED":
      return <FileSignature className="w-5 h-5 text-emerald-500" />;
    case "MAINTENANCE_LOGGED":
      return <Settings className="w-5 h-5 text-gray-500" />;
    case "GENERAL_UPDATE":
      return <Info className="w-5 h-5 text-blue-500" />;
    case "SYSTEM_ALERT":
      return <Info className="w-5 h-5 text-indigo-500" />;
    default:
      return <AlertTriangle className="w-5 h-5 text-rose-500" />;
  }
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsReadZustand = useNotificationStore((state) => state.markAsRead);
  const markAllAsReadZustand = useNotificationStore(
    (state) => state.markAllAsRead,
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    markAsReadZustand(id);
    try {
      await markRead(id);
    } catch (err: unknown) {
      console.warn("Failed to mark notification as read on server:", err);
    }
  };

  const handleMarkAllRead = async () => {
    markAllAsReadZustand();
    try {
      await markAllRead();
    } catch (err: unknown) {
      console.warn("Failed to mark all as read:", err);
    }
  };

  const handleNotificationClick = (notif: (typeof notifications)[0]) => {
    if (!notif.is_read) {
      handleMarkRead(notif.id);
    }
    if (notif.action_url) {
      navigate(notif.action_url);
      setIsOpen(false);
    }
  };

  const recent10 = notifications.slice(0, 10);

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 dark:focus:ring-offset-slate-900"
      >
        <Bell
          className={`w-6 h-6 ${unreadCount > 0 ? "fill-current animate-pulse text-indigo-500" : ""}`}
          strokeWidth={1.5}
        />

        {unreadCount > 0 && (
          <>
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 z-10">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 rounded-full bg-rose-400 opacity-75 animate-ping" />
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl shadow-indigo-500/10 z-50 overflow-hidden flex flex-col max-h-[500px]"
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex gap-4 items-center">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs font-semibold tracking-wide text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors uppercase"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2 flex flex-col gap-1 custom-scrollbar">
              {recent10.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 text-center flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500"
                >
                  <Check className="w-10 h-10 opacity-20" />
                  <p className="text-sm font-medium">
                    You're completely caught up!
                  </p>
                </motion.div>
              ) : (
                recent10.map((notif) => (
                  <motion.div
                    layout
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`
                      relative p-3 rounded-xl flex gap-3 text-sm transition-all cursor-pointer group
                      ${
                        notif.is_read
                          ? "opacity-70 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          : "bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/40"
                      }
                    `}
                  >
                    {!notif.is_read && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-md" />
                    )}

                    <div className="mt-1 shrink-0 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                      {getIconForType(
                        notif.notification_type || "GENERAL_UPDATE",
                      )}
                    </div>

                    <div className="flex flex-col flex-1 min-w-0 pr-6">
                      <span
                        className={`font-semibold tracking-tight truncate ${notif.is_read ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-white"}`}
                      >
                        {notif.message}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 font-medium flex items-center gap-1">
                        {new Date(notif.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {!notif.is_read && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkRead(notif.id, e)}
                        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 text-xs uppercase font-bold text-slate-400 hover:text-indigo-600 transition-all shrink-0 bg-white dark:bg-slate-800 px-2 py-1 rounded-md shadow-sm border border-slate-200 dark:border-slate-700"
                      >
                        Read
                      </button>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
