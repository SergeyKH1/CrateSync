"use client";

import { useState } from "react";

/**
 * Stub: detect whether the CrateSync Chrome extension is installed.
 * Will be implemented by the frontend/extension agent.
 */
export function useExtension() {
  const [installed] = useState(false);
  const [loading] = useState(false);
  return { installed, loading };
}
