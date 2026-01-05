"use client";

interface ProTeaserProps {
  feature: string;
  description: string;
  compact?: boolean;
}

export function ProTeaser({ feature, description, compact = false }: ProTeaserProps) {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/50">
        <span className="text-amber-600 text-[10px] font-bold">PRO</span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 text-white">
      {/* Subtle glow effects */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-orange-500/10 rounded-full blur-xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] font-bold text-black uppercase">
            Pro
          </span>
          <span className="text-[10px] text-gray-400">Coming Soon</span>
        </div>

        {/* Content */}
        <h3 className="text-[14px] font-semibold mb-1 leading-tight">{feature}</h3>
        <p className="text-[11px] text-gray-400 mb-3 line-clamp-2 leading-relaxed">{description}</p>

        {/* CTA Button */}
        <button
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-black font-semibold text-[12px] hover:from-amber-300 hover:to-orange-400 active:scale-[0.98] transition-all"
          onClick={() => {
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
    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-orange-500 text-[9px] font-bold text-black uppercase">
      Pro
    </span>
  );
}

// Blurred/locked content overlay
export function ProLockedOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px] rounded-xl">
        <div className="text-center px-3">
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-black font-semibold text-[11px] mb-1.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Pro
          </div>
          <p className="text-[10px] text-gray-500">Upgrade to unlock</p>
        </div>
      </div>
    </div>
  );
}

// Inline upgrade prompt - compact version
export function UpgradePrompt({ feature }: { feature: string }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/30">
      <div className="flex items-center gap-2">
        <span className="text-amber-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </span>
        <span className="text-[11px] font-medium text-gray-600">
          Unlock {feature}
        </span>
      </div>
      <button className="px-2 py-1 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[10px] font-semibold hover:from-amber-300 hover:to-orange-400 active:scale-95 transition-all">
        Upgrade
      </button>
    </div>
  );
}
