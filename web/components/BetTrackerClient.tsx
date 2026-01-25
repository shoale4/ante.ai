"use client";

import { useState, useEffect, useCallback } from "react";
import { usePro } from "@/lib/pro-context";

interface TrackedBet {
  id: string;
  createdAt: string;
  type: "single" | "arb";
  status: "pending" | "won" | "lost" | "void" | "cashed";

  // Bet details
  sport: string;
  event: string;
  eventDate: string;
  market: string;
  selection: string;
  book: string;
  odds: number;
  stake: number;

  // For arb bets, track both legs
  arbLegs?: {
    selection: string;
    book: string;
    odds: number;
    stake: number;
    status: "pending" | "won" | "lost" | "void";
  }[];

  // Results
  payout?: number;
  profit?: number;
  notes?: string;
}

interface BetFormData {
  type: "single" | "arb";
  sport: string;
  event: string;
  eventDate: string;
  market: string;
  selection: string;
  book: string;
  odds: string;
  stake: string;
  notes: string;
}

const STORAGE_KEY = "hedj_tracked_bets";

function loadBets(): TrackedBet[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveBets(bets: TrackedBet[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bets));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function exportToCSV(bets: TrackedBet[]): void {
  const headers = [
    "ID",
    "Created",
    "Type",
    "Status",
    "Sport",
    "Event",
    "Event Date",
    "Market",
    "Selection",
    "Book",
    "Odds",
    "Stake",
    "Payout",
    "Profit",
    "Notes",
  ];

  const rows = bets.map((bet) => [
    bet.id,
    bet.createdAt,
    bet.type,
    bet.status,
    bet.sport,
    bet.event,
    bet.eventDate,
    bet.market,
    bet.selection,
    bet.book,
    bet.odds.toString(),
    bet.stake.toFixed(2),
    bet.payout?.toFixed(2) ?? "",
    bet.profit?.toFixed(2) ?? "",
    bet.notes ?? "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hedj-bets-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatOdds(odds: number): string {
  if (odds >= 100) return `+${odds}`;
  return odds.toString();
}

function calculatePayout(stake: number, odds: number): number {
  if (odds >= 100) {
    return stake + stake * (odds / 100);
  } else {
    return stake + stake * (100 / Math.abs(odds));
  }
}

export function BetTrackerClient() {
  const { isPro } = usePro();
  const [bets, setBets] = useState<TrackedBet[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBet, setEditingBet] = useState<TrackedBet | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "settled">("all");
  const [formData, setFormData] = useState<BetFormData>({
    type: "single",
    sport: "",
    event: "",
    eventDate: "",
    market: "moneyline",
    selection: "",
    book: "",
    odds: "",
    stake: "",
    notes: "",
  });

  useEffect(() => {
    setBets(loadBets());
  }, []);

  // Hide page from non-Pro users
  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="text-6xl mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500">The page you're looking for doesn't exist.</p>
      </div>
    );
  }

  const handleSaveBet = useCallback(() => {
    const odds = parseInt(formData.odds);
    const stake = parseFloat(formData.stake);

    if (!formData.event || !formData.selection || !formData.book || isNaN(odds) || isNaN(stake)) {
      alert("Please fill in all required fields");
      return;
    }

    const newBet: TrackedBet = {
      id: editingBet?.id ?? generateId(),
      createdAt: editingBet?.createdAt ?? new Date().toISOString(),
      type: formData.type,
      status: editingBet?.status ?? "pending",
      sport: formData.sport,
      event: formData.event,
      eventDate: formData.eventDate,
      market: formData.market,
      selection: formData.selection,
      book: formData.book,
      odds,
      stake,
      notes: formData.notes || undefined,
    };

    let updatedBets: TrackedBet[];
    if (editingBet) {
      updatedBets = bets.map((b) => (b.id === editingBet.id ? newBet : b));
    } else {
      updatedBets = [newBet, ...bets];
    }

    setBets(updatedBets);
    saveBets(updatedBets);
    setShowForm(false);
    setEditingBet(null);
    setFormData({
      type: "single",
      sport: "",
      event: "",
      eventDate: "",
      market: "moneyline",
      selection: "",
      book: "",
      odds: "",
      stake: "",
      notes: "",
    });
  }, [bets, editingBet, formData]);

  const handleUpdateStatus = useCallback(
    (betId: string, status: TrackedBet["status"]) => {
      const updatedBets = bets.map((bet) => {
        if (bet.id !== betId) return bet;

        let payout: number | undefined;
        let profit: number | undefined;

        if (status === "won") {
          payout = calculatePayout(bet.stake, bet.odds);
          profit = payout - bet.stake;
        } else if (status === "lost") {
          payout = 0;
          profit = -bet.stake;
        } else if (status === "void" || status === "cashed") {
          payout = bet.stake;
          profit = 0;
        }

        return { ...bet, status, payout, profit };
      });

      setBets(updatedBets);
      saveBets(updatedBets);
    },
    [bets]
  );

  const handleDeleteBet = useCallback(
    (betId: string) => {
      if (!confirm("Are you sure you want to delete this bet?")) return;
      const updatedBets = bets.filter((b) => b.id !== betId);
      setBets(updatedBets);
      saveBets(updatedBets);
    },
    [bets]
  );

  const handleEditBet = useCallback((bet: TrackedBet) => {
    setEditingBet(bet);
    setFormData({
      type: bet.type,
      sport: bet.sport,
      event: bet.event,
      eventDate: bet.eventDate,
      market: bet.market,
      selection: bet.selection,
      book: bet.book,
      odds: bet.odds.toString(),
      stake: bet.stake.toString(),
      notes: bet.notes ?? "",
    });
    setShowForm(true);
  }, []);

  const filteredBets = bets.filter((bet) => {
    if (filter === "pending") return bet.status === "pending";
    if (filter === "settled") return bet.status !== "pending";
    return true;
  });

  // Calculate stats
  const stats = {
    totalBets: bets.length,
    pendingBets: bets.filter((b) => b.status === "pending").length,
    totalStaked: bets.reduce((sum, b) => sum + b.stake, 0),
    totalProfit: bets
      .filter((b) => b.profit !== undefined)
      .reduce((sum, b) => sum + (b.profit ?? 0), 0),
    winRate:
      bets.filter((b) => b.status === "won" || b.status === "lost").length > 0
        ? (bets.filter((b) => b.status === "won").length /
            bets.filter((b) => b.status === "won" || b.status === "lost")
              .length) *
          100
        : 0,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bets</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your bets and monitor performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(bets)}
            className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={bets.length === 0}
          >
            Export CSV
          </button>
          <button
            onClick={() => {
              setEditingBet(null);
              setFormData({
                type: "single",
                sport: "",
                event: "",
                eventDate: "",
                market: "moneyline",
                selection: "",
                book: "",
                odds: "",
                stake: "",
                notes: "",
              });
              setShowForm(true);
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            + Add Bet
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Bets</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalBets}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-amber-600">{stats.pendingBets}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Staked</div>
          <div className="text-2xl font-bold text-gray-900">
            ${stats.totalStaked.toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Profit/Loss</div>
          <div
            className={`text-2xl font-bold ${
              stats.totalProfit >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {stats.totalProfit >= 0 ? "+" : ""}${stats.totalProfit.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4">
        {(["all", "pending", "settled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              filter === f
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Bets List */}
      {filteredBets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="text-gray-400 mb-2">No bets found</div>
          <p className="text-sm text-gray-500">
            {filter !== "all"
              ? "Try changing the filter"
              : "Add your first bet to start tracking"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBets.map((bet) => (
            <div
              key={bet.id}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${
                        bet.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : bet.status === "won"
                          ? "bg-green-100 text-green-700"
                          : bet.status === "lost"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {bet.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {bet.sport || "Sport"}
                    </span>
                  </div>
                  <div className="font-medium text-gray-900">{bet.event}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {bet.selection} @ {bet.book}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-gray-500">
                      Odds: <span className="font-medium text-gray-900">{formatOdds(bet.odds)}</span>
                    </span>
                    <span className="text-gray-500">
                      Stake: <span className="font-medium text-gray-900">${bet.stake.toFixed(2)}</span>
                    </span>
                    {bet.payout !== undefined && (
                      <span className="text-gray-500">
                        Return:{" "}
                        <span
                          className={`font-medium ${
                            (bet.profit ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          ${bet.payout.toFixed(2)}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {bet.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(bet.id, "won")}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Mark as Won"
                      >
                        W
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(bet.id, "lost")}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Mark as Lost"
                      >
                        L
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(bet.id, "void")}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                        title="Mark as Void"
                      >
                        V
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleEditBet(bet)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                    title="Edit"
                  >
                    E
                  </button>
                  <button
                    onClick={() => handleDeleteBet(bet.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    X
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Bet Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingBet ? "Edit Bet" : "Add Bet"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingBet(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  X
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sport
                    </label>
                    <select
                      value={formData.sport}
                      onChange={(e) =>
                        setFormData({ ...formData, sport: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select...</option>
                      <option value="NFL">NFL</option>
                      <option value="NBA">NBA</option>
                      <option value="NCAAB">NCAAB</option>
                      <option value="MLB">MLB</option>
                      <option value="NHL">NHL</option>
                      <option value="Soccer">Soccer</option>
                      <option value="MMA">MMA</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Market
                    </label>
                    <select
                      value={formData.market}
                      onChange={(e) =>
                        setFormData({ ...formData, market: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="moneyline">Moneyline</option>
                      <option value="spread">Spread</option>
                      <option value="total">Total</option>
                      <option value="prop">Player Prop</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event *
                  </label>
                  <input
                    type="text"
                    value={formData.event}
                    onChange={(e) =>
                      setFormData({ ...formData, event: e.target.value })
                    }
                    placeholder="e.g., Chiefs vs Bills"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) =>
                      setFormData({ ...formData, eventDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selection *
                  </label>
                  <input
                    type="text"
                    value={formData.selection}
                    onChange={(e) =>
                      setFormData({ ...formData, selection: e.target.value })
                    }
                    placeholder="e.g., Chiefs -3.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Book *
                    </label>
                    <input
                      type="text"
                      value={formData.book}
                      onChange={(e) =>
                        setFormData({ ...formData, book: e.target.value })
                      }
                      placeholder="e.g., FanDuel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Odds *
                    </label>
                    <input
                      type="text"
                      value={formData.odds}
                      onChange={(e) =>
                        setFormData({ ...formData, odds: e.target.value })
                      }
                      placeholder="e.g., -110"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stake *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <input
                      type="text"
                      value={formData.stake}
                      onChange={(e) =>
                        setFormData({ ...formData, stake: e.target.value })
                      }
                      placeholder="100.00"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Optional notes..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingBet(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBet}
                    className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    {editingBet ? "Save Changes" : "Add Bet"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
