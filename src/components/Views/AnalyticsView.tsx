import React from 'react';
import {
  BarChart3,
  TrendingDown,
  Coins,
  ShieldCheck,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { SavingsSnapshot, Provider } from '../../types';

interface AnalyticsViewProps {
  stats: SavingsSnapshot;
  providers: Provider[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ stats, providers }) => {
  // Mock trend data over 7 days
  const spendTrendData = [
    { day: 'Mon', route402Spent: 1.2, naiveSpent: 1.8, saved: 0.6 },
    { day: 'Tue', route402Spent: 2.5, naiveSpent: 3.9, saved: 1.4 },
    { day: 'Wed', route402Spent: 4.1, naiveSpent: 6.2, saved: 2.1 },
    { day: 'Thu', route402Spent: 6.8, naiveSpent: 10.1, saved: 3.3 },
    { day: 'Fri', route402Spent: 9.4, naiveSpent: 13.9, saved: 4.5 },
    { day: 'Sat', route402Spent: 12.1, naiveSpent: 17.8, saved: 5.7 },
    { day: 'Sun', route402Spent: Number((stats.totalSpentMicroUSDC / 1000000).toFixed(2)), naiveSpent: Number((stats.naiveBaselineMicroUSDC / 1000000).toFixed(2)), saved: Number((stats.savedMicroUSDC / 1000000).toFixed(2)) },
  ];

  const latencyBarData = providers.map((p) => ({
    name: p.name.split(' ')[0],
    P50: p.latencyP50Ms,
    P95: p.latencyP95Ms,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-6 shadow-card">
        <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#FF0A16]" />
          Economic Savings & Performance Analytics
        </h2>
        <p className="text-xs text-zinc-400 font-inter mt-1">
          Prove tangible cost savings and latency optimizations against naive single-provider routing strategies.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-5 shadow-card">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono-num">
            Cumulative Cost Savings
          </span>
          <div className="text-2xl font-bold font-display text-emerald-400 mt-2">
            ${(stats.savedMicroUSDC / 1000000).toFixed(4)} USDC
          </div>
          <p className="text-xs text-zinc-500 mt-1 font-inter">
            {stats.savedPercent}% reduction vs naive single-provider selection
          </p>
        </div>

        <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-5 shadow-card">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono-num">
            Refused Unpaid Protection
          </span>
          <div className="text-2xl font-bold font-display text-white mt-2">
            {stats.paymentsRefused} Calls Saved
          </div>
          <p className="text-xs text-zinc-500 mt-1 font-inter">
            Zero USDC paid for failed or corrupt provider responses
          </p>
        </div>

        <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-5 shadow-card">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono-num">
            Rerouted Mid-Flight
          </span>
          <div className="text-2xl font-bold font-display text-[#FF5C5C] mt-2">
            {stats.requestsRerouted} Failovers
          </div>
          <p className="text-xs text-zinc-500 mt-1 font-inter">
            Circuit breaker triggered automatic secondary provider retry
          </p>
        </div>
      </div>

      {/* Cumulative Spend Chart */}
      <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white font-display">
              Cumulative Spend: Route402 vs Naive Single-Provider ($ USDC)
            </h3>
            <p className="text-xs text-zinc-400 font-inter">
              Lower line indicates actual spent USDC; green area represents capital preserved.
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spendTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} unit="$" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  borderColor: '#27272a',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#ffffff',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="route402Spent"
                name="Route402 Actual Spend ($)"
                stroke="#FF0A16"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="naiveSpent"
                name="Naive Strategy ($)"
                stroke="#71717a"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="saved"
                name="Net Preserved Capital ($)"
                stroke="#10B981"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Latency Comparison Bar Chart */}
      <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-6 shadow-card">
        <h3 className="text-base font-bold text-white font-display mb-1">
          Provider Response Latency Spectrum (P50 vs P95 ms)
        </h3>
        <p className="text-xs text-zinc-400 font-inter mb-4">
          Lower latency allows agents to run synchronous decision loops within single HTTP timeouts.
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={latencyBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} unit="ms" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  borderColor: '#27272a',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#ffffff',
                }}
              />
              <Legend />
              <Bar dataKey="P50" name="P50 Median Latency (ms)" fill="#FF0A16" radius={[4, 4, 0, 0]} />
              <Bar dataKey="P95" name="P95 Tail Latency (ms)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
