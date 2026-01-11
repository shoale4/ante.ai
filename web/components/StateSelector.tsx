"use client";

import { useState, useEffect } from "react";
import { getAllStates, getStateInfo, StateInfo } from "@/lib/state-legality";
import { BOOK_NAMES } from "@/lib/book-rankings";

const STATE_STORAGE_KEY = "hedj_user_state";

export function useUserState() {
  const [userState, setUserState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STATE_STORAGE_KEY);
    if (stored) {
      setUserState(stored);
    }
    setIsLoaded(true);
  }, []);

  const setState = (abbr: string | null) => {
    setUserState(abbr);
    if (abbr) {
      localStorage.setItem(STATE_STORAGE_KEY, abbr);
    } else {
      localStorage.removeItem(STATE_STORAGE_KEY);
    }
  };

  return { userState, setUserState: setState, isLoaded };
}

interface Props {
  compact?: boolean;
}

export function StateSelector({ compact = false }: Props) {
  const { userState, setUserState, isLoaded } = useUserState();
  const [isOpen, setIsOpen] = useState(false);
  const states = getAllStates();

  const selectedState = userState ? getStateInfo(userState) : null;

  if (!isLoaded) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 text-xs font-medium transition-colors ${
          compact
            ? "px-1.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
            : "px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
      >
        <span className="text-[11px]">📍</span>
        {selectedState ? (
          <span className="text-[11px]">{selectedState.abbr}</span>
        ) : (
          <span className="hidden sm:inline text-[11px]">US</span>
        )}
        <svg className="w-2.5 h-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 max-h-[60vh] sm:max-h-80 overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-3 py-2">
              <span className="text-xs font-medium text-gray-500">Select Your State</span>
            </div>

            {/* Clear selection */}
            <button
              onClick={() => {
                setUserState(null);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-xs text-gray-500 hover:bg-gray-50 border-b border-gray-100"
            >
              Show all sportsbooks
            </button>

            {/* State list */}
            <div className="py-1">
              {states.map((state) => (
                <button
                  key={state.abbr}
                  onClick={() => {
                    setUserState(state.abbr);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                    userState === state.abbr ? "bg-purple-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {state.name}
                    </span>
                    {state.legal ? (
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        state.legalBooks.length > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {state.legalBooks.length > 0 ? `${state.legalBooks.length} books` : "Limited"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                        Not legal
                      </span>
                    )}
                  </div>
                  {state.notes && (
                    <p className="text-[10px] text-gray-400 mt-0.5">{state.notes}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Component to show state-specific info banner
export function StateBanner() {
  const { userState, isLoaded } = useUserState();

  if (!isLoaded || !userState) return null;

  const stateInfo = getStateInfo(userState);
  if (!stateInfo) return null;

  if (!stateInfo.legal) {
    return (
      <div className="px-4 py-2 bg-red-50 border-b border-red-100">
        <p className="text-xs text-red-700 text-center">
          <strong>Note:</strong> Sports betting is not currently legal in {stateInfo.name}.
          {stateInfo.notes && ` ${stateInfo.notes}.`}
        </p>
      </div>
    );
  }

  if (stateInfo.legalBooks.length === 0) {
    return (
      <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
        <p className="text-xs text-amber-700 text-center">
          <strong>Note:</strong> {stateInfo.name} has limited betting options.
          {stateInfo.notes && ` ${stateInfo.notes}.`}
        </p>
      </div>
    );
  }

  return null;
}

// Hook to filter books by state
export function useStateFilteredBooks(books: string[]): string[] {
  const { userState, isLoaded } = useUserState();

  if (!isLoaded || !userState) return books;

  const stateInfo = getStateInfo(userState);
  if (!stateInfo || !stateInfo.legal || stateInfo.legalBooks.length === 0) {
    return books;
  }

  return books.filter(book => stateInfo.legalBooks.includes(book.toLowerCase()));
}
