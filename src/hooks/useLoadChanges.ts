"use client";

import { useEffect, useRef } from "react";

import type { LoadRecord } from "@/lib/loads/types";

const useLoadChanges = (onChanges: (items: LoadRecord[]) => void): void => {
  const callbackRef = useRef(onChanges);

  callbackRef.current = onChanges;

  useEffect(() => {
    let since: string = new Date().toISOString();
    let active: boolean = true;
    const poll = async (): Promise<void> => {
      if (!active || document.visibilityState !== "visible") {
        return;
      }
      const response: Response = await fetch(`/api/loads/changes?since=${encodeURIComponent(since)}`);

      if (!response.ok) {
        throw new Error(`Load changes request failed: ${response.status}`);
      }
      const result: { loads: LoadRecord[]; since: string } = await response.json();

      callbackRef.current(result.loads);
      since = result.since;
    };
    const timer: number = window.setInterval(() => {
      void poll().catch((error: unknown) => console.error("Could not poll load changes.", error));
    }, 3000);
    const handleVisibility = (): void => {
      if (document.visibilityState === "visible") {
        void poll().catch((error: unknown) => console.error("Could not poll load changes.", error));
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return (): void => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);
};

export { useLoadChanges };
