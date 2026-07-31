import React from 'react';
import {
  Bot,
  Route,
  Brain,
  Server,
  Coins,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface RoutingVisualizationProps {
  selectedProviderName?: string;
  activeStep?: number; // 0: Idle, 1: Agent Request, 2: Decision Scoring, 3: Provider Dispatch, 4: Algorand Settlement, 5: Verified Response
  capability?: string;
  isSimulating?: boolean;
}

export const RoutingVisualization: React.FC<RoutingVisualizationProps> = ({
  selectedProviderName = 'Beta FastSummarize',
  activeStep = 0,
  capability = 'text.summarize',
  isSimulating = false,
}) => {
  const steps = [
    {
      id: 1,
      name: 'Agent Request',
      sub: 'x402 Negotiator',
      icon: Bot,
      detail: 'Holds 0 ALGO | Max Ceiling',
    },
    {
      id: 2,
      name: 'Route402 Router',
      sub: 'Circuit Guard',
      icon: Route,
      detail: 'Evaluates 5 Candidates',
    },
    {
      id: 3,
      name: 'Decision Engine',
      sub: 'Multi-Factor Scorer',
      icon: Brain,
      detail: 'Price, Latency, Reliability',
    },
    {
      id: 4,
      name: 'Selected Provider',
      sub: selectedProviderName,
      icon: Server,
      detail: `Capability: ${capability}`,
    },
    {
      id: 5,
      name: 'Algorand x402',
      sub: 'Atomic Grouping',
      icon: Coins,
      detail: 'Fee Sponsored (0 ALGO)',
    },
    {
      id: 6,
      name: 'Verified Response',
      sub: 'Paid on Delivery',
      icon: CheckCircle,
      detail: 'Result Returned to Agent',
    },
  ];

  return (
    <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-6 shadow-card mb-6">
      <div className="flex flex-wrap items-center justify-between mb-5 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white font-display">
              AI Routing & Settlement Flow
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-mono-num font-semibold bg-[#FF0A16]/15 text-[#FF5C5C] border border-[#FF0A16]/30 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#FF0A16]" /> Real-time Pipeline
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-inter mt-0.5">
            Synchronous HTTP 402 payment negotiation, provider selection, and instant Algorand finality.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono-num">
          <span className="text-zinc-500">Selected Target:</span>
          <span className="font-semibold text-zinc-100 bg-[#121215] px-2.5 py-1 rounded-lg border border-zinc-800 font-display">
            {selectedProviderName}
          </span>
        </div>
      </div>

      {/* Flow Diagram Stepper */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = isSimulating && activeStep === step.id;
          const isPassed = isSimulating && activeStep > step.id;

          return (
            <div key={step.id} className="relative flex flex-col items-center">
              {/* Card node */}
              <div
                className={`w-full p-3.5 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? 'bg-[#FF0A16]/15 border-[#FF0A16] shadow-md ring-2 ring-[#FF0A16]/30'
                    : isPassed
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-[#121215] border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-[#FF0A16] text-white'
                        : isPassed
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#050505] border border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-mono-num font-semibold text-zinc-500">
                    0{step.id}
                  </span>
                </div>

                <div className="text-left space-y-0.5">
                  <div className="text-xs font-bold text-white font-display truncate">
                    {step.name}
                  </div>
                  <div className="text-[11px] font-medium text-[#FF5C5C] font-inter truncate">
                    {step.sub}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono-num truncate pt-1">
                    {step.detail}
                  </div>
                </div>
              </div>

              {/* Connecting arrow for desktop view */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-zinc-600">
                  <ArrowRight
                    className={`w-4 h-4 ${
                      isPassed ? 'text-emerald-400' : 'text-zinc-700'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Callout */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-xs text-zinc-400 font-inter">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            <strong className="text-zinc-200">Zero-Risk Execution:</strong> Unusable or failed responses trigger instant payment refusal & re-routing.
          </span>
        </div>
        <div className="font-mono-num text-[11px] text-zinc-500">
          Algorand ASA USDC #31566704 | GoPlausible Facilitator
        </div>
      </div>
    </div>
  );
};
