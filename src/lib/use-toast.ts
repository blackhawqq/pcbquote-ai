"use client";

import * as React from "react";

type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
};

const listeners: Array<(toasts: ToastProps[]) => void> = [];
let memoryState: ToastProps[] = [];

function dispatch(toast: Omit<ToastProps, "id">) {
  const id = Math.random().toString(36).slice(2);
  memoryState = [{ ...toast, id }, ...memoryState].slice(0, 5);
  listeners.forEach((listener) => listener(memoryState));

  // Auto dismiss
  setTimeout(() => {
    memoryState = memoryState.filter((t) => t.id !== id);
    listeners.forEach((listener) => listener(memoryState));
  }, 5000);
}

export function toast(props: Omit<ToastProps, "id">) {
  dispatch(props);
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>(memoryState);

  React.useEffect(() => {
    listeners.push(setToasts);
    return () => {
      const idx = listeners.indexOf(setToasts);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  return { toasts };
}
