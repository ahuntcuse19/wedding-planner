"use client";

import React from "react";
import { ToastProvider } from "./Toast";
import { ConfirmProvider } from "./ConfirmDialog";

// Client-side context providers shared across the whole app. Mounted once in
// the root layout so every module can use useToast() / useConfirm().
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  );
}
