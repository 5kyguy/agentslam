"use client";

import { useState } from "react";

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function toast(title: string, description?: string) {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, title, description }].slice(-4));
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 2800);
  }

  return { toasts, toast };
}
