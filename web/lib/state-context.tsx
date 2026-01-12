"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const STATE_STORAGE_KEY = "hedj_user_state";

interface StateContextValue {
  userState: string | null;
  setUserState: (state: string | null) => void;
  isLoaded: boolean;
}

const StateContext = createContext<StateContextValue | null>(null);

export function StateProvider({ children }: { children: ReactNode }) {
  const [userState, setUserStateInternal] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Don't persist state selection - always start with all US (no filter)
    // Users can select a state during their session if they want
    setIsLoaded(true);
  }, []);

  const setUserState = (abbr: string | null) => {
    setUserStateInternal(abbr);
    // Not persisting to localStorage - resets on page refresh
  };

  return (
    <StateContext.Provider value={{ userState, setUserState, isLoaded }}>
      {children}
    </StateContext.Provider>
  );
}

export function useUserState() {
  const context = useContext(StateContext);
  if (!context) {
    // Fallback for components outside provider (shouldn't happen)
    return { userState: null, setUserState: () => {}, isLoaded: true };
  }
  return context;
}
