"use client";

import { useState, useEffect } from "react";
import { usePro } from "@/lib/pro-context";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function isValidEmail(email: string): boolean {
  return email.includes("@") && email.includes(".");
}

export function RedeemCodeModal({ isOpen, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { activatePro } = usePro();

  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setCode("");
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !code.trim()) return;

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid code");
        return;
      }

      // Success! Activate Pro
      activatePro();
      setSuccess(true);

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] font-bold text-black uppercase">
                Pro
              </span>
              <h2 className="text-lg font-semibold text-gray-900">Redeem Code</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center active:scale-95 transition-all"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Enter your email and invite code to unlock Pro
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Pro Unlocked!</h3>
              <p className="text-sm text-gray-500 mt-1">Enjoy unlimited arbitrage opportunities</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                {/* Email Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    autoFocus
                    disabled={isLoading}
                  />
                </div>

                {/* Code Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">
                    Invite Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="HEDJ-XXXX-XXXX"
                    className="w-full px-4 py-3 text-center text-lg font-mono tracking-wider border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent uppercase"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !code.trim() || !email.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-semibold hover:from-amber-300 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                >
                  {isLoading ? "Checking..." : "Redeem Code"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook to manage redeem modal state
export function useRedeemModal() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
