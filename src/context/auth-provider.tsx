
"use client";

// This file is not used in the anonymous-only version of the app.
// It is kept for potential future use if authentication is re-enabled.

import { createContext, type ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
