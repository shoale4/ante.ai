"use client";

interface ProTeaserProps {
  feature: string;
  description: string;
  compact?: boolean;
}

export function ProTeaser({ feature, description, compact = false }: ProTeaserProps) {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50">
        <span className="text-amber-600 text-xs font-semibold">PRO</span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-xs font-bold text-black">
            PRO
          </span>
          <span className="text-sm text-gray-400">Coming Soon</span>
        </div>

        <h3 className="text-lg font-bold mb-2">{feature}</h3>
        <p className="text-sm text-gray-300 mb-4">{description}</p>

        <button
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-semibold text-sm hover:from-amber-300 hover:to-orange-400 transition-all"
          onClick={() => {
            // TODO: Open waitlist modal or redirect to signup
            alert("Coming soon! We'll notify you when Pro launches.");
          }}
        >
          Join Waitlist
        </button>
      </div>
    </div>
  );
}

export function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] font-bold text-black uppercase">
      Pro
    </span>
  );
}

// Blurred/locked content overlay
export function ProLockedOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-xl">
        <div className="text-center px-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-semibold text-sm mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Pro Feature
          </div>
          <p className="text-xs text-gray-600">Upgrade to unlock</p>
        </div>
      </div>
    </div>
  );
}

// Inline upgrade prompt
export function UpgradePrompt({ feature }: { feature: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50">
      <div className="flex items-center gap-2">
        <span className="text-amber-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </span>
        <span className="text-sm font-medium text-gray-700">
          Unlock {feature} with Pro
        </span>
      </div>
      <button className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-black text-xs font-semibold hover:from-amber-300 hover:to-orange-400 transition-all">
        Upgrade
      </button>
    </div>
  );
}
