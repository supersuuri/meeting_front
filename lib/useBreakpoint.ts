// lib/useBreakpoint.ts
import { useState, useEffect } from "react";

export function useBreakpoint() {
  const [isNarrow, setIsNarrow] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsNarrow(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isNarrow;
}
