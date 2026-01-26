"use client";

import { useState } from "react";

interface CalculationResult {
  isArb: boolean;
  roiPercent: number;
  impliedProbSum: number;
  stakes: { odds: number; stake: number; payout: number }[];
  totalStake: number;
  guaranteedPayout: number;
  guaranteedProfit: number;
}

function americanToDecimal(american: number): number {
  if (american >= 100) {
    return 1 + american / 100;
  } else if (american <= -100) {
    return 1 + 100 / Math.abs(american);
  }
  return 0;
}

function calculateArb(odds: number[], totalStake: number): CalculationResult | null {
  // Validate all odds
  for (const o of odds) {
    if (o > -100 && o < 100) return null;
  }

  const decimals = odds.map(americanToDecimal);
  if (decimals.some(d => d <= 0)) return null;

  const impliedProbs = decimals.map(d => 1 / d);
  const impliedProbSum = impliedProbs.reduce((a, b) => a + b, 0);
  const isArb = impliedProbSum < 1;

  // Calculate stakes
  const stakes = odds.map((o, i) => {
    const stake = (impliedProbs[i] / impliedProbSum) * totalStake;
    const payout = stake * decimals[i];
    return {
      odds: o,
      stake: Math.round(stake * 100) / 100,
      payout: Math.round(payout * 100) / 100,
    };
  });

  const guaranteedPayout = Math.min(...stakes.map(s => s.payout));
  const actualTotalStake = stakes.reduce((sum, s) => sum + s.stake, 0);
  const guaranteedProfit = guaranteedPayout - actualTotalStake;
  const roiPercent = (guaranteedProfit / actualTotalStake) * 100;

  return {
    isArb,
    roiPercent: Math.round(roiPercent * 100) / 100,
    impliedProbSum: Math.round(impliedProbSum * 10000) / 10000,
    stakes,
    totalStake: Math.round(actualTotalStake * 100) / 100,
    guaranteedPayout: Math.round(guaranteedPayout * 100) / 100,
    guaranteedProfit: Math.round(guaranteedProfit * 100) / 100,
  };
}

export function ArbCalculator() {
  const [odds1, setOdds1] = useState<string>("");
  const [odds2, setOdds2] = useState<string>("");
  const [odds3, setOdds3] = useState<string>(""); // Optional for 3-way
  const [totalStake, setTotalStake] = useState<number>(100);
  const [label1, setLabel1] = useState<string>("Side 1");
  const [label2, setLabel2] = useState<string>("Side 2");
  const [label3, setLabel3] = useState<string>("Draw");
  const [isExpanded, setIsExpanded] = useState(false);

  const oddsArray: number[] = [];
  if (odds1) oddsArray.push(parseInt(odds1));
  if (odds2) oddsArray.push(parseInt(odds2));
  if (odds3) oddsArray.push(parseInt(odds3));

  const result = oddsArray.length >= 2 ? calculateArb(oddsArray, totalStake) : null;
  const labels = [label1, label2, label3];

  const presets = [50, 100, 250, 500, 1000];

  const formatOdds = (odds: number) => (odds > 0 ? `+${odds}` : odds.toString());

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🧮</span>
          <span className="font-semibold text-gray-900">Arb Calculator</span>
          <span className="text-xs text-gray-500 bg-white/70 px-2 py-0.5 rounded-full">
            Manual odds check
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4 border-t border-gray-100">
          {/* Odds Inputs */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-medium text-gray-500 uppercase block mb-1">
                  Side 1 Label
                </label>
                <input
                  type="text"
                  value={label1}
                  onChange={(e) => setLabel1(e.target.value)}
                  placeholder="e.g., Liverpool"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-500 uppercase block mb-1">
                  Odds (American)
                </label>
                <input
                  type="number"
                  value={odds1}
                  onChange={(e) => setOdds1(e.target.value)}
                  placeholder="-700"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-medium text-gray-500 uppercase block mb-1">
                  Side 2 Label
                </label>
                <input
                  type="text"
                  value={label2}
                  onChange={(e) => setLabel2(e.target.value)}
                  placeholder="e.g., Qarabag"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-500 uppercase block mb-1">
                  Odds (American)
                </label>
                <input
                  type="number"
                  value={odds2}
                  onChange={(e) => setOdds2(e.target.value)}
                  placeholder="+2200"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Optional 3rd side for soccer */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-medium text-gray-500 uppercase block mb-1">
                  Draw (Optional)
                </label>
                <input
                  type="text"
                  value={label3}
                  onChange={(e) => setLabel3(e.target.value)}
                  placeholder="Draw"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-500 uppercase block mb-1">
                  Odds (Optional)
                </label>
                <input
                  type="number"
                  value={odds3}
                  onChange={(e) => setOdds3(e.target.value)}
                  placeholder="+1200"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Total Stake */}
          <div>
            <label className="text-[10px] font-medium text-gray-500 uppercase block mb-1.5">
              Total Stake
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400 font-medium">$</span>
              <input
                type="number"
                min="0"
                value={totalStake || ""}
                onChange={(e) => setTotalStake(parseFloat(e.target.value) || 0)}
                placeholder="100"
                className="w-full pl-7 pr-3 py-3 text-lg bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
              />
            </div>
            <div className="flex gap-1.5 mt-2">
              {presets.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTotalStake(amount)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                    totalStake === amount
                      ? "bg-blue-500 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className={`rounded-xl p-4 ${result.isArb ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              {/* Status Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {result.isArb ? (
                    <>
                      <span className="text-lg">✅</span>
                      <span className="font-bold text-green-700">ARB FOUND!</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">❌</span>
                      <span className="font-bold text-red-700">No Arb</span>
                    </>
                  )}
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                  result.isArb ? "bg-green-500 text-white" : "bg-red-200 text-red-700"
                }`}>
                  {result.roiPercent > 0 ? "+" : ""}{result.roiPercent}%
                </div>
              </div>

              {/* Implied Probability */}
              <div className="text-xs text-gray-600 mb-3">
                Implied Probability Sum: <span className="font-mono font-semibold">{(result.impliedProbSum * 100).toFixed(2)}%</span>
                {result.impliedProbSum < 1 && <span className="text-green-600 ml-1">(under 100% = arb)</span>}
              </div>

              {/* Stakes Breakdown */}
              <div className="space-y-2">
                {result.stakes.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-lg p-2 border border-gray-100">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{labels[i]}</div>
                      <div className="text-xs text-gray-500">@ {formatOdds(s.odds)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">${s.stake.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Pays ${s.payout.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Profit Summary */}
              {result.isArb && (
                <div className="mt-3 pt-3 border-t border-green-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Stake</span>
                    <span className="text-sm font-semibold text-gray-900">${result.totalStake.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Guaranteed Payout</span>
                    <span className="text-sm font-semibold text-gray-900">${result.guaranteedPayout.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-green-700">Guaranteed Profit</span>
                    <span className="text-lg font-bold text-green-600">+${result.guaranteedProfit.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!result && oddsArray.length < 2 && (
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-500">Enter odds for at least 2 sides to calculate</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
