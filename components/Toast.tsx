"use client";

import { useState, useCallback } from "react";

export type ToastState = { type: "success" | "error"; msg: string } | null;

export function Toast({ state }: { state: ToastState }) {
  if (!state) return null;
  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 ${
        state.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
      }`}
    >
      {state.msg}
    </div>
  );
}

export function useToast() {
  const [state, setState] = useState<ToastState>(null);
  const show = useCallback((type: "success" | "error", msg: string) => {
    setState({ type, msg });
    setTimeout(() => setState(null), 4000);
  }, []);
  return { state, show };
}
