"use client";

import * as React from "react";
import { notifications } from "@mantine/notifications";
import {
  IconCircleCheck,
  IconAlertTriangle,
  IconInfoCircle,
  IconX,
} from "@tabler/icons-react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const toastConfig: Record<ToastType, { color: string; icon: React.ReactNode }> = {
  success: { color: "teal", icon: <IconCircleCheck size={18} /> },
  error: { color: "red", icon: <IconX size={18} /> },
  warning: { color: "yellow", icon: <IconAlertTriangle size={18} /> },
  info: { color: "blue", icon: <IconInfoCircle size={18} /> },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = React.useCallback((type: ToastType, message: string) => {
    const cfg = toastConfig[type];
    notifications.show({
      message,
      color: cfg.color,
      icon: cfg.icon,
      withBorder: true,
      autoClose: 3500,
    });
  }, []);

  const dismiss = React.useCallback((id: string) => {
    notifications.hide(id);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
