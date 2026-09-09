"use client";
import { useEffect } from "react";
export function OfflineRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/sw.js")
        .then(async () => {
          const registration = await navigator.serviceWorker.ready;
          registration.active?.postMessage({
            type: "CACHE_ASSETS",
            urls: performance
              .getEntriesByType("resource")
              .map((e) => e.name)
              .filter((u) => u.includes("/_next/static/")),
          });
        })
        .catch(() => {
          /* Online operation remains available when browser storage is disabled. */
        });
    }
  }, []);
  return null;
}
