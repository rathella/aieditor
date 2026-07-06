"use client";

import { useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Debounces `value` and calls `onSave` after `delayMs` of inactivity.
 * Skips the very first render so loading initial content never triggers a
 * save, and skips saves while the value is unchanged from the last save.
 */
export function useAutosave(
  value: string,
  onSave: (value: string) => Promise<void>,
  delayMs = 1200
): AutosaveStatus {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const isFirstRender = useRef(true);
  const lastSaved = useRef(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastSaved.current = value;
      return;
    }

    if (value === lastSaved.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus("saving");

    timeoutRef.current = setTimeout(async () => {
      try {
        await onSave(value);
        lastSaved.current = value;
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, delayMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delayMs]);

  return status;
}
