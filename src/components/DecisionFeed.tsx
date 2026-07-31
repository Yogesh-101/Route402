import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Brain,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Coins,
  ArrowRight,
  Route,
  Zap,
} from 'lucide-react';
import { RouteDecision } from '../types';

interface DecisionFeedProps {
  decisions: RouteDecision[];
  onSelectDecision?: (decision: RouteDecision) => void;
}

export const DecisionFeed: React.FC<DecisionFeedProps> = ({ decisions }) => {
  const [expandedId, setExpandedId] = useState<string | null>(
    decisions.length > 0 ? decisions[0].id : null
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-6 shadow-card mb-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/80">
        <div>
          <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#FF0A16]" />
            Live AI Decision Engine Feed
          </h3>
          <p className="text-xs text-zinc-400 font-inter mt-0.5">
            Real-time scoring logs showing evaluated candidate pools, weighted composite scores, and plain-English decision reasoning.
          </p>
        </div>
        <span className="text-xs font-mono-num font-semibold text-[#FF5C5C] bg-[#FF0A16]/15 border border-[#FF0A16]/30 px-2.5 py-1 rounded-lg">
          {decisions.length} Decisions Logged
        </span>
      </div>

      <div className="space-y-3">
        {decisions.length === 0 ? (
          <div className="text-center py-8 text-sm text-zinc-500 font-inter">
            No routing decisions recorded yet. Run a request from the top right button!
          </div>
        ) : (
          decisions.map((decision) => {
            const isExpanded = expandedId === decision.id;
            const timeAgo = Math.max(0, Math.round((Date.now() - decision.timestamp) / 1000));

            return (
              <div
                key={decision.id}
                className={`border rounded-xl transition-all ${
                  isExpanded
                    ? 'border-[#FF0A16] bg-[#160507]/30 shadow-sm ring-1 ring-[#FF0A16]/30'
                    : 'border-zinc-800/80 bg-[#121215] hover:border-zinc-700'
                }`}
              >
                {/* Collapsed Header */}
                <div
                  onClick={() => toggleExpand(decision.id)}
                  className="p-4 cursor-pointer flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FF0A16]/15 flex items-center justify-center text-[#FF5C5C]">
                      <Route className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white font-display">
                          {decision.selectedProviderName}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-mono-num font-semibold bg-[#FF0A16]/15 text-[#FF5C5C] border border-[#FF0A16]/30 rounded">
                          {decision.capability}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-zinc-300 font-inter mt-0.5">
                        {decision.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[11px] font-mono-num text-zinc-500 block">
                        {timeAgo}s ago
                      </span>
                      <span className="text-[11px] font-mono-num text-zinc-400 font-medium">
                        {decision.candidates.length} Candidates Evaluated
                      </span>
                    </div>

                    <button className="text-zinc-500 hover:text-zinc-200">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[#FF5C5C]" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Math & Candidate Breakdown */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-zinc-800/80 bg-[#09090b] rounded-b-xl space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono-num mb-2">
                        Candidate Scoring Matrix (Lower Composite Score Wins)
                      </h4>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-inter border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-800 bg-[#050505] text-zinc-400 font-mono-num text-[11px]">
                              <th className="py-2 px-3">Provider</th>
                              <th className="py-2 px-3">Price (µUSDC)</th>
                              <th className="py-2 px-3">Est. Latency</th>
                              <th className="py-2 px-3">Reliability</th>
                              <th className="py-2 px-3">Composite Score</th>
                              <th className="py-2 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60">
                            {decision.candidates.map((cand) => {
                              const isWinner =
                                cand.providerId === decision.selectedProviderId;

                              return (
                                <tr
                                  key={cand.providerId}
                                  className={
                                    isWinner
                                      ? 'bg-[#FF0A16]/15 font-medium text-white'
                                      : 'text-zinc-400'
                                  }
                                >
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-1.5">
                                      {isWinner && (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5C5C]" />
                                      )}
                                      <span className="font-semibold text-zinc-100">{cand.providerName}</span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono-num">
                                    {cand.priceMicroUSDC.toLocaleString()} µUSDC
                                  </td>
                                  <td className="py-2.5 px-3 font-mono-num">
                                    {cand.expectedLatencyMs}ms
                                  </td>
                                  <td className="py-2.5 px-3 font-mono-num">
                                    {(cand.reliabilityScore * 100).toFixed(1)}%
                                  </td>
                                  <td className="py-2.5 px-3 font-mono-num font-bold">
                                    <span
                                      className={
                                        isWinner
                                          ? 'text-[#FF5C5C] bg-[#FF0A16]/25 border border-[#FF0A16]/40 px-2 py-0.5 rounded'
                                          : 'text-zinc-400'
                                      }
                                    >
                                      {cand.compositeScore}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {cand.eligible ? (
                                      <span className="text-emerald-400 font-semibold text-[11px] font-mono-num bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                        Eligible
                                      </span>
                                    ) : (
                                      <span className="text-red-400 font-semibold text-[11px] font-mono-num bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 flex items-center gap-1">
                                        <XCircle className="w-3 h-3 text-red-500" />
                                        {cand.ineligibleReason || 'Rejected'}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Fallback Chain Details */}
                    <div className="p-3 rounded-xl bg-[#050505] border border-zinc-800 flex items-center justify-between text-xs font-inter text-zinc-300">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>
                          <strong>Fallback Chain Order:</strong>{' '}
                          {decision.fallbackChain.join(' → ')}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono-num text-zinc-500">
                        Decision ID: {decision.id}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
