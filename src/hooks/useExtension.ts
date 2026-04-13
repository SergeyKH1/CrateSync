"use client";

import { useState, useEffect } from "react";

const EXTENSION_ID = "cratesync-extension-placeholder-id";

export function useExtension() {
  const [installed, setInstalled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detect = () => {
      try {
        if (
          typeof window !== "undefined" &&
          typeof chrome !== "undefined" &&
          chrome &&
          chrome.runtime
        ) {
          const rt = chrome.runtime;
          rt.sendMessage(
            EXTENSION_ID,
            { type: "CRATESYNC_PING" },
            (response) => {
              if (rt.lastError) {
                setInstalled(false);
              } else {
                setInstalled(!!response);
              }
              setLoading(false);
            }
          );
        } else {
          setInstalled(false);
          setLoading(false);
        }
      } catch {
        setInstalled(false);
        setLoading(false);
      }
    };

    detect();
  }, []);

  return { installed, loading };
}
