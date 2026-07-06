"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border border-border bg-card shadow-card-hover text-sm text-primary-800 font-sans",
          title: "font-medium",
          description: "text-muted-foreground",
          actionButton: "bg-primary-700 text-white rounded-md",
          cancelButton: "bg-secondary text-primary-800 rounded-md",
          success: "!text-success",
          error: "!text-destructive",
        },
      }}
    />
  );
}
