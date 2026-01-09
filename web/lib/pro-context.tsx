"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ProContextType {
  isPro: boolean;
  activatePro: () => void;
  deactivatePro: () => void;
}

const ProContext = createContext<ProContextType | undefined>(undefined);

const PRO_STORAGE_KEY = "hedj_pro_status";

export function ProProvider({ children }: { children: ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Pro status from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(PRO_STORAGE_KEY);
    if (stored === "true") {
      setIsPro(true);
    }
    setIsLoaded(true);
  }, []);

  const activatePro = () => {
    setIsPro(true);
    localStorage.setItem(PRO_STORAGE_KEY, "true");
  };

  const deactivatePro = () => {
    setIsPro(false);
    localStorage.removeItem(PRO_STORAGE_KEY);
  };

  // Don't render children until we've loaded the Pro status
  // This prevents a flash of "free" content
  if (!isLoaded) {
    return null;
  }

  return (
    <ProContext.Provider value={{ isPro, activatePro, deactivatePro }}>
      {children}
    </ProContext.Provider>
  );
}

export function usePro() {
  const context = useContext(ProContext);
  if (context === undefined) {
    throw new Error("usePro must be used within a ProProvider");
  }
  return context;
}
