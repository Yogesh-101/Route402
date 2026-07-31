import React from 'react';
import {
  Server,
  Activity,
  AlertTriangle,
  Zap,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  ShieldAlert,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Provider, ChaosMode } from '../types';

interface ProviderCardProps {
  provider: Provider;
  onSetChaos: (providerId: string, mode: ChaosMode) => void;
  onResetCircuit: (providerId: string) => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onSetChaos,
  onResetCircuit,
}) => {
  const isCircuitOpen = provider.circuitState === 'open';
  const totalCalls = provider.successCount + provider.failureCount;
  const successRate = totalCalls > 0 ? ((provider.successCount / totalCalls) * 100).toFixed(1) : '100.0';

  // Format total earned
  const totalEarnedFormatted = (provider.totalEarnedMicroUSDC / 1000000).toFixed(3);
  const priceFormatted = (provider.advertisedPriceMicroUSDC / 1000000).toFixed(3);

  // Status badge config
  const getStatusBadge = () => {
    if (isCircuitOpen) {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold bg-red-950/60 text-red-400 border border-red-800/80 rounded-full font-mono-num flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Circuit Open ({provider.consecutiveFailures} Err)
        </span>
      );
    }
    if (provider.chaosMode === 'offline') {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold bg-zinc-900 text-zinc-400 border border-zinc-800 rounded-full font-mono-num flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5 text-zinc-500" /> Offline
        </span>
      );
    }
    if (provider.chaosMode === 'slow') {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/80 rounded-full font-mono-num flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-500" /> Latency Spike
        </span>
      );
    }
    if (provider.chaosMode === 'corrupt') {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold bg-red-950/40 text-red-400 border border-red-800/50 rounded-full font-mono-num flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Corrupt Output
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 rounded-full font-mono-num flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Healthy
      </span>
    );
  };

  return (
    <div
      className={`bg-[#09090b] border rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all relative flex flex-col justify-between ${
        isCircuitOpen ? 'border-[#FF0A16]/50 bg-[#160507]/40' : 'border-zinc-800/80'
      }`}
    >
      <div>
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                isCircuitOpen
                  ? 'bg-red-950/60 text-red-400 border border-red-800/80'
                  : 'bg-[#121215] text-zinc-100 border border-zinc-800'
              }`}
            >
              <Server className="w-5 h-5 text-[#FF5C5C]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-display">
                {provider.name}
              </h4>
              <p className="text-[11px] font-mono-num text-zinc-500 truncate max-w-[180px]">
                {provider.endpoint}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Capabilities Pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {provider.capabilities.map((cap) => (
            <span
              key={cap}
              className="px-2 py-0.5 text-[10px] font-mono-num font-semibold bg-[#121215] text-zinc-400 border border-zinc-800 rounded"
            >
              {cap}
            </span>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#050505] border border-zinc-800/80 mb-4">
          <div>
            <span className="text-[10px] font-mono-num text-zinc-500 uppercase block">
              Advertised Price
            </span>
            <span className="text-xs font-bold font-mono-num text-zinc-100">
              ${priceFormatted} <span className="text-[10px] font-normal text-zinc-500">USDC</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono-num text-zinc-500 uppercase block">
              Latency (P50/P95)
            </span>
            <span className="text-xs font-bold font-mono-num text-zinc-100">
              {provider.latencyP50Ms}ms / {provider.latencyP95Ms}ms
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono-num text-zinc-500 uppercase block">
              Success Rate
            </span>
            <span
              className={`text-xs font-bold font-mono-num ${
                Number(successRate) < 95 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {successRate}%
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono-num text-zinc-500 uppercase block">
              Earned Revenue
            </span>
            <span className="text-xs font-bold font-mono-num text-[#FF5C5C]">
              ${totalEarnedFormatted} USDC
            </span>
          </div>
        </div>

        {/* Latency Sparkline */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono-num mb-1">
            <span>Latency Trend (ms)</span>
            <span>Rolling 5 calls</span>
          </div>
          <div className="h-12 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={provider.latencyHistory}>
                <defs>
                  <linearGradient id={`colorLat-${provider.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF0A16" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF0A16" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={['dataMin - 50', 'dataMax + 100']} />
                <Area
                  type="monotone"
                  dataKey="latencyMs"
                  stroke={isCircuitOpen ? '#FF0A16' : '#FF5C5C'}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#colorLat-${provider.id})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Card Footer Controls (Chaos simulator actions) */}
      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-inter">
        {isCircuitOpen ? (
          <button
            onClick={() => onResetCircuit(provider.id)}
            className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors font-mono-num flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Reset Circuit Breaker
          </button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-zinc-500 font-mono-num">Simulate:</span>
            <div className="flex items-center gap-1 font-mono-num">
              <button
                onClick={() => onSetChaos(provider.id, provider.chaosMode === 'slow' ? 'healthy' : 'slow')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  provider.chaosMode === 'slow'
                    ? 'bg-amber-600 text-white'
                    : 'bg-[#121215] text-zinc-300 hover:bg-amber-950/40 hover:text-amber-400 border border-zinc-800'
                }`}
              >
                +Latency
              </button>
              <button
                onClick={() => onSetChaos(provider.id, provider.chaosMode === 'corrupt' ? 'healthy' : 'corrupt')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  provider.chaosMode === 'corrupt'
                    ? 'bg-red-600 text-white'
                    : 'bg-[#121215] text-zinc-300 hover:bg-red-950/40 hover:text-red-400 border border-zinc-800'
                }`}
              >
                Corrupt
              </button>
              <button
                onClick={() => onSetChaos(provider.id, provider.chaosMode === 'offline' ? 'healthy' : 'offline')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  provider.chaosMode === 'offline'
                    ? 'bg-zinc-800 text-white'
                    : 'bg-[#121215] text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                Kill
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
