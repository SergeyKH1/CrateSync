"use client";

import { useState, useEffect } from "react";

const EXTENSION_ID = "cratesync-extension-placeholder-id";

export function useExtension() {
  const [installed, setInstalled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detect = async () => {
      try {
        if (
          typeof window !== "undefined" &&
          typeof chrome !== "undefined" &&
          chrome.runtime &&
          chrome.runtime.sendMessage
        ) {
          chrome.runtime.sendMessage(
            EXTENSION_ID,
            { type: "CRATESYNC_PING" },
            (response) => {
              if (chrome.runtime.lastError) {
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
