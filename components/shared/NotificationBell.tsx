"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import {
  getUserNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  UserNotification,
} from "@/actions/notifications.actions";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const load = async () => {
    try {
      const data = await getUserNotificationsAction();
      setNotifications(data);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    setOpen((o) => !o);
  };

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await markNotificationReadAction(id);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await markAllNotificationsReadAction();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 dark:text-[#A8B1BD] hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100/70 dark:hover:bg-white/5 transition-colors"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-teal-600 text-white text-[10px] font-bold leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white/95 dark:bg-[rgba(21,25,34,0.97)] backdrop-blur-[20px] border border-white/50 dark:border-[rgba(255,255,255,0.08)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl overflow-hidden z-50"
          >
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-white/10">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Notifications</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {!loaded ? (
                <div className="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500">Loading…</div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600 opacity-60" />
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => !n.isRead && handleMarkRead(n.id)}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        n.isRead
                          ? "hover:bg-slate-50/70 dark:hover:bg-white/5"
                          : "bg-teal-50/50 dark:bg-teal-950/20 hover:bg-teal-50/80 dark:hover:bg-teal-950/30"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-600 flex-shrink-0" />}
                        <div className={n.isRead ? "" : "ml-0"}>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                          {n.message && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                          )}
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{timeAgo(n.deliveredAt)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
