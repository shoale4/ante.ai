"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GameOdds } from "@/lib/types";
import { ArbitrageBadge } from "./ArbitrageFinder";
import { LastUpdated } from "./LastUpdated";
import { StateSelector } from "./StateSelector";

interface Props {
  games: GameOdds[];
  lastUpdated: string | null;
}

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/arbitrage", label: "Arbitrage" },
  { href: "/feed", label: "Feed" },
];

export function Header({ games, lastUpdated }: Props) {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Update indicator position when pathname changes
  useEffect(() => {
    if (!navRef.current) return;

    const activeLink = navRef.current.querySelector(`a[href="${pathname}"]`) as HTMLElement;
    if (activeLink) {
      const navRect = navRef.current.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      setIndicatorStyle({
        left: linkRect.left - navRect.left,
        width: linkRect.width,
      });
    }
  }, [pathname]);


  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              {/* Logo Icon */}
              <div className="relative">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30 rotate-3 hover:rotate-0 transition-transform duration-300">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                    <polyline points="16 7 22 7 22 13"></polyline>
                  </svg>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-md border-2 border-white" />
              </div>
              {/* Logo Text */}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                  <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">hedj</span>
                </h1>
                <p className="hidden sm:block text-[10px] font-medium text-[--text-secondary] tracking-widest uppercase">Bet Smarter</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav
              ref={navRef}
              className="hidden sm:flex items-center ml-6 p-1 bg-gray-100/80 rounded-xl relative"
            >
              {/* Sliding indicator */}
              <div
                className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                style={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width,
                  opacity: indicatorStyle.width > 0 ? 1 : 0,
                }}
              />
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative z-10 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    pathname === link.href
                      ? "text-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Desktop badges */}
          <div className="hidden sm:flex items-center gap-2 flex-nowrap">
            <StateSelector compact />
            <ArbitrageBadge games={games} />
            <LastUpdated timestamp={lastUpdated} />
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>

          {/* Mobile badges - simplified */}
          <div className="flex sm:hidden items-center gap-1.5">
            <StateSelector compact />
            <ArbitrageBadge games={games} />
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
