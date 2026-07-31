import React from 'react';
import {
  Activity,
  Coins,
  TrendingDown,
  Clock,
  ShieldCheck,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import { SavingsSnapshot } from '../types';

interface HeroMetricsProps {
  stats: SavingsSnapshot;
  onOpenAnalytics: () => void;
}

export const HeroMetrics: React.FC<HeroMetricsProps> = ({
  stats,
  onOpenAnalytics,
}) => {
  const formattedSpent = (stats.totalSpentMicroUSDC / 1000000).toFixed(4);
  const formattedSaved = (stats.savedMicroUSDC / 1000000).toFixed(4);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Requests Routed Card */}
      <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono-num">
            Requests Routed
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#FF0A16]/10 flex items-center justify-center text-[#FF5C5C]">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl lg:text-3xl font-bold font-display text-white">
            {stats.totalRequests.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-400 font-mono-num bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            <ArrowUpRight className="w-3 h-3" /> +18.4%
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-500 font-inter pt-2 border-t border-zinc-800/80">
          <span>Autonomous agent calls</span>
          <span className="font-mono-num text-zinc-300">100% Succeeded</span>
        </div>
      </div>

      {/* Savings vs Naive Card - Highlight Card */}
      <div className="bg-gradient-to-br from-[#09090b] via-[#160507] to-[#250609] border border-[#FF0A16]/40 rounded-2xl p-5 shadow-card hover:shadow-[0_0_25px_rgba(255,10,22,0.18)] transition-all relative overflow-hidden group cursor-pointer" onClick={onOpenAnalytics}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#FF5C5C] uppercase tracking-wider font-mono-num flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#FF0A16] fill-[#FF0A16]" /> Savings vs Naive
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#FF0A16]/15 flex items-center justify-center text-[#FF5C5C]">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl lg:text-3xl font-bold font-display text-[#FF5C5C]">
            {stats.savedPercent}%
          </span>
          <span className="text-xs font-semibold text-emerald-400 font-mono-num">
            Saved Today
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-300 font-inter pt-2 border-t border-[#FF0A16]/20">
          <span>Saved: <strong className="font-mono-num text-white">${formattedSaved} USDC</strong></span>
          <span className="text-[11px] text-[#FF5C5C] underline font-medium">View Analysis &rarr;</span>
        </div>
      </div>

      {/* Total Volume Spent Card */}
      <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono-num">
            Settlement Volume
          </span>
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-2xl lg:text-3xl font-bold font-display text-white">
            ${formattedSpent}
          </span>
          <span className="text-xs font-semibold text-zinc-400 font-mono-num">USDC</span>
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-500 font-inter pt-2 border-t border-zinc-800/80">
          <span>x402 Protocol Settlement</span>
          <span className="font-mono-num text-zinc-300">
            {stats.totalSpentMicroUSDC.toLocaleString()} µUSDC
          </span>
        </div>
      </div>

      {/* Settlement Time Card */}
      <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono-num">
            Avg Settlement Time
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#FF0A16]/10 flex items-center justify-center text-[#FF5C5C]">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl lg:text-3xl font-bold font-display text-white">
            {(stats.avgSettlementTimeMs / 1000).toFixed(2)}s
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#FF5C5C] bg-[#FF0A16]/10 px-1.5 py-0.5 rounded border border-[#FF0A16]/20 font-mono-num">
            <ShieldCheck className="w-3 h-3 text-[#FF0A16]" /> Algorand Block
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-500 font-inter pt-2 border-t border-zinc-800/80">
          <span>Refused Unpaid: <strong className="font-mono-num text-[#FF5C5C]">{stats.paymentsRefused}</strong></span>
          <span className="font-mono-num text-zinc-300">Instant Finality</span>
        </div>
      </div>
    </div>
  );
};
