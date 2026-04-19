import { useEffect } from "react";

export const useBarcodeScanner = (onScan: (barcode: string) => void) => {
  useEffect(() => {
    let buffer = "";
    let timeout: NodeJS.Timeout;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (buffer.length > 4) onScan(buffer.trim());
        buffer = "";
        return;
      }
      buffer += e.key;
      clearTimeout(timeout);
      timeout = setTimeout(() => { buffer = ""; }, 80);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onScan]);
};