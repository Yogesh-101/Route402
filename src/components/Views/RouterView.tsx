import React, { useState } from 'react';
import {
  Route,
  Brain,
  Sliders,
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Code,
} from 'lucide-react';
import { Provider, CapabilityType, PriorityProfile } from '../../types';
import { evaluateAndScoreCandidates, generateDecisionExplanation } from '../../lib/routingEngine';

interface RouterViewProps {
  providers: Provider[];
  onTriggerRequest: (
    capability: CapabilityType,
    priority: PriorityProfile,
    maxPrice?: number
  ) => void;
}

export const RouterView: React.FC<RouterViewProps> = ({
  providers,
  onTriggerRequest,
}) => {
  const [capability, setCapability] = useState<CapabilityType>('text.summarize');
  const [priority, setPriority] = useState<PriorityProfile>('balanced');
  const [maxPrice, setMaxPrice] = useState<number>(5000);

  // Scored candidate matrix live preview
  const candidates = evaluateAndScoreCandidates(providers, {
    capability,
    payload: {},
    constraints: { priority, maxPriceMicroUSDC: maxPrice },
  });

  const selectedWinner = candidates
    .filter((c) => c.eligible)
    .sort((a, b) => a.compositeScore - b.compositeScore)[0];

  const explanation = selectedWinner
    ? generateDecisionExplanation(selectedWinner, candidates, {
        capability,
        payload: {},
        constraints: { priority, maxPriceMicroUSDC: maxPrice },
      })
    : 'No eligible provider satisfies the current constraints.';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-6 shadow-card">
        <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
          <Route className="w-6 h-6 text-[#FF0A16]" />
          AI Routing Scorer & Decision Engine Matrix
        </h2>
        <p className="text-xs text-zinc-400 font-inter mt-1">
          Route402 evaluates candidate pools per request using multi-factor linear scoring over live price, rolling p95 latency, and observed reliability.
        </p>
      </div>

      {/* Algorithm Formula Card */}
      <div className="bg-[#09090b] text-zinc-100 rounded-2xl p-6 shadow-card border border-zinc-800/80">
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#FF0A16]" />
            <h3 className="text-sm font-bold font-display text-white">
              Mathematical Scoring Formula
            </h3>
          </div>
          <span className="text-[11px] font-mono-num bg-[#FF0A16]/15 text-[#FF5C5C] border border-[#FF0A16]/30 px-2 py-0.5 rounded">
            Deterministic & Testable
          </span>
        </div>

        <div className="p-4 bg-[#050505] border border-zinc-800 rounded-xl font-code text-xs text-emerald-400 leading-relaxed overflow-x-auto mb-3">
          compositeScore = (Wp * normPrice) + (Wl * normLatency) + (Wr * unreliability) + min(consecutiveFailures * 0.15, 0.45)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-inter text-zinc-400">
          <div>
            <strong className="text-white font-mono-num block mb-0.5">cost Profile:</strong>
            Wp = 0.65 | Wl = 0.10 | Wr = 0.25 (Aggressive cost minimization)
          </div>
          <div>
            <strong className="text-white font-mono-num block mb-0.5">speed Profile:</strong>
            Wp = 0.10 | Wl = 0.65 | Wr = 0.25 (Latency critical tasks)
          </div>
          <div>
            <strong className="text-white font-mono-num block mb-0.5">balanced Profile:</strong>
            Wp = 0.35 | Wl = 0.35 | Wr = 0.30 (Default enterprise optimization)
          </div>
        </div>
      </div>

      {/* Live Interactive Scorer Inspector */}
      <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-6 shadow-card space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white font-display">
            Live Scorer Playground & Candidate Simulation
          </h3>
          <button
            onClick={() => onTriggerRequest(capability, priority, maxPrice)}
            className="px-4 py-2 bg-[#FF0A16] hover:bg-[#E60000] text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 font-inter shadow-[0_0_15px_rgba(255,10,22,0.3)] cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-400" /> Execute Selected Winner
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-inter text-xs">
          <div>
            <label className="block text-zinc-400 font-medium mb-1">Capability</label>
            <select
              value={capability}
              onChange={(e) => setCapability(e.target.value as CapabilityType)}
              className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2 font-mono-num text-zinc-100"
            >
              <option value="text.summarize">text.summarize</option>
              <option value="code.review">code.review</option>
              <option value="image.generate">image.generate</option>
              <option value="audio.transcribe">audio.transcribe</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">Priority Weighting</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as PriorityProfile)}
              className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2 font-mono-num text-zinc-100"
            >
              <option value="cost">cost (Wp: 0.65, Wl: 0.10)</option>
              <option value="speed">speed (Wp: 0.10, Wl: 0.65)</option>
              <option value="balanced">balanced (Wp: 0.35, Wl: 0.35)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between text-zinc-400 font-medium mb-1.5">
              <label>Max Price Ceiling</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Math.max(0, Number(e.target.value)))}
                  className="w-28 bg-[#050505] border border-zinc-800 focus:border-[#FF0A16] focus:outline-none rounded-lg px-2.5 py-1 font-mono-num text-right font-bold text-[#FF5C5C] text-xs transition-colors"
                  placeholder="1000"
                />
                <span className="text-xs font-mono-num text-zinc-400">µUSDC</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="30000"
              step="500"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#FF0A16] mt-1 cursor-pointer"
            />
            <div className="text-[10px] text-zinc-500 font-mono-num text-right mt-1">
              ≈ ${(maxPrice / 1000000).toFixed(6)} USDC
            </div>
          </div>
        </div>

        {/* Generated Explanation Result Box */}
        <div className="p-4 rounded-xl bg-[#160507]/40 border border-[#FF0A16]/30 text-xs font-inter space-y-1">
          <div className="text-[10px] font-mono-num uppercase font-bold text-[#FF5C5C]">
            Decision Reason Generator Output:
          </div>
          <div className="text-sm font-bold text-white font-display">{explanation}</div>
        </div>

        {/* Candidates Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-inter border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-[#050505] text-zinc-400 font-mono-num text-[11px] uppercase">
                <th className="py-2.5 px-3">Candidate</th>
                <th className="py-2.5 px-3">Price (µUSDC)</th>
                <th className="py-2.5 px-3">P95 Latency</th>
                <th className="py-2.5 px-3">Reliability</th>
                <th className="py-2.5 px-3">Composite Score</th>
                <th className="py-2.5 px-3">Eligibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {candidates.map((cand) => {
                const isWinner = selectedWinner && cand.providerId === selectedWinner.providerId;

                return (
                  <tr
                    key={cand.providerId}
                    className={isWinner ? 'bg-[#FF0A16]/15 font-semibold text-white' : 'text-zinc-400'}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {isWinner && <CheckCircle2 className="w-4 h-4 text-[#FF5C5C]" />}
                        <span className="text-zinc-100 font-display">{cand.providerName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono-num">{cand.priceMicroUSDC.toLocaleString()} µUSDC</td>
                    <td className="py-3 px-3 font-mono-num">{cand.expectedLatencyMs}ms</td>
                    <td className="py-3 px-3 font-mono-num">{(cand.reliabilityScore * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3 font-mono-num font-bold">
                      <span className={isWinner ? 'text-[#FF5C5C] bg-[#FF0A16]/25 border border-[#FF0A16]/40 px-2 py-0.5 rounded' : ''}>
                        {cand.compositeScore}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono-num">
                      {cand.eligible ? (
                        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Eligible
                        </span>
                      ) : (
                        <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                          {cand.ineligibleReason}
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
    </div>
  );
};
