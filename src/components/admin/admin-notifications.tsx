"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert, X } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type AdminNotificationTone = "error";

interface AdminNotification {
  id: string;
  message: string;
  requestId?: string;
  sentryEventId?: string;
  title: string;
  tone: AdminNotificationTone;
}

interface AdminNotificationInput {
  message: string;
  requestId?: string;
  sentryEventId?: string;
  title: string;
  tone?: AdminNotificationTone;
}

interface AdminNotificationContextValue {
  dismiss: (id: string) => void;
  notify: (notification: AdminNotificationInput) => string;
}

const VISIBLE_DURATION_MS = 8000;

const AdminNotificationContext = createContext<AdminNotificationContextValue>({
  dismiss: () => {
    // default provider noop
  },
  notify: () => "",
});

function makeNotificationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AdminNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (notification: AdminNotificationInput) => {
      const id = makeNotificationId();
      setNotifications((current) => [
        ...current,
        {
          id,
          tone: "error",
          ...notification,
        },
      ]);
      window.setTimeout(() => dismiss(id), VISIBLE_DURATION_MS);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      dismiss,
      notify,
    }),
    [dismiss, notify]
  );

  return (
    <AdminNotificationContext value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 left-4 z-[70] flex flex-col items-end gap-2 sm:left-auto sm:w-[380px]">
        <AnimatePresence initial={false}>
          {notifications.map((notification) => (
            <motion.div
              animate={{ opacity: 1, x: 0, y: 0 }}
              className="pointer-events-auto w-full overflow-hidden rounded-lg border border-destructive/30 bg-background/95 text-foreground shadow-2xl shadow-black/20 backdrop-blur-md"
              exit={{ opacity: 0, x: 18, scale: 0.98 }}
              initial={{ opacity: 0, x: 18, y: -4 }}
              key={notification.id}
              layout
              role={notification.tone === "error" ? "alert" : "status"}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div className="flex items-start gap-3 p-4">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="mt-1 text-muted-foreground text-sm leading-snug">
                    {notification.message}
                  </p>
                  {notification.requestId || notification.sentryEventId ? (
                    <dl className="mt-2 space-y-1 font-mono text-[11px] text-muted-foreground/70 leading-tight">
                      {notification.requestId ? (
                        <div className="flex min-w-0 gap-1.5">
                          <dt className="shrink-0">Convex</dt>
                          <dd className="truncate">{notification.requestId}</dd>
                        </div>
                      ) : null}
                      {notification.sentryEventId ? (
                        <div className="flex min-w-0 gap-1.5">
                          <dt className="shrink-0">Sentry</dt>
                          <dd className="truncate">
                            {notification.sentryEventId}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}
                </div>
                <button
                  aria-label="Dismiss notification"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                  onClick={() => dismiss(notification.id)}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AdminNotificationContext>
  );
}

export function useAdminNotifications() {
  return useContext(AdminNotificationContext);
}
