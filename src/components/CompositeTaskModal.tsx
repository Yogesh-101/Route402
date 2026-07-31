import React, { useState } from 'react';
import {
  Layers,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Coins,
  ArrowRight,
  Server,
  X,
  Play,
  FileCode,
} from 'lucide-react';
import { Provider } from '../types';

interface CompositeTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: Provider[];
  onExecuteComposite: (prov1Id: string, prov2Id: string) => void;
  isSimulating: boolean;
}

export const CompositeTaskModal: React.FC<CompositeTaskModalProps> = ({
  isOpen,
  onClose,
  providers,
  onExecuteComposite,
  isSimulating,
}) => {
  const [step1Provider, setStep1Provider] = useState<string>('prov_beta');
  const [step2Provider, setStep2Provider] = useState<string>('prov_delta');

  if (!isOpen) return null;

  const p1 = providers.find((p) => p.id === step1Provider) || providers[0];
  const p2 = providers.find((p) => p.id === step2Provider) || providers[1];

  const totalCostMicroUSDC = p1.advertisedPriceMicroUSDC + p2.advertisedPriceMicroUSDC;
  const formattedTotal = (totalCostMicroUSDC / 1000000).toFixed(4);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#09090b] rounded-2xl max-w-2xl w-full border border-zinc-800 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-zinc-400 hover:text-white text-lg font-bold cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-[#FF0A16]/15 text-[#FF5C5C] border border-[#FF0A16]/30 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">
              Algorand Atomic Group Composite Task (US8 / P1)
            </h3>
            <p className="text-xs text-zinc-400 font-inter">
              Execute multi-provider pipelines (Summarize + Audit) in a single, atomic Algorand transaction group.
            </p>
          </div>
        </div>

        {/* Workflow Visualizer */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1 Selector */}
            <div className="p-4 rounded-xl bg-[#121215] border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono-num font-bold text-[#FF5C5C] uppercase">
                  Step 1: Text Summarize
                </span>
                <span className="text-xs font-mono-num font-semibold text-zinc-100">
                  {p1.advertisedPriceMicroUSDC.toLocaleString()} µUSDC
                </span>
              </div>
              <select
                value={step1Provider}
                onChange={(e) => setStep1Provider(e.target.value)}
                className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2 text-xs font-inter text-zinc-100"
              >
                {providers
                  .filter((p) => p.capabilities.includes('text.summarize'))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.advertisedPriceMicroUSDC.toLocaleString()} µUSDC)
                    </option>
                  ))}
              </select>
            </div>

            {/* Step 2 Selector */}
            <div className="p-4 rounded-xl bg-[#121215] border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono-num font-bold text-[#FF5C5C] uppercase">
                  Step 2: Code Audit
                </span>
                <span className="text-xs font-mono-num font-semibold text-zinc-100">
                  {p2.advertisedPriceMicroUSDC.toLocaleString()} µUSDC
                </span>
              </div>
              <select
                value={step2Provider}
                onChange={(e) => setStep2Provider(e.target.value)}
                className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2 text-xs font-inter text-zinc-100"
              >
                {providers
                  .filter((p) => p.capabilities.includes('code.review'))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.advertisedPriceMicroUSDC.toLocaleString()} µUSDC)
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Group Properties Card */}
          <div className="p-4 rounded-xl bg-[#160507]/40 border border-[#FF0A16]/30 text-xs text-zinc-200 space-y-2">
            <div className="flex items-center justify-between font-mono-num font-bold">
              <span className="flex items-center gap-1.5 text-[#FF5C5C]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Algorand Atomic Group Primitive
              </span>
              <span>Total: ${formattedTotal} USDC ({totalCostMicroUSDC.toLocaleString()} µUSDC)</span>
            </div>
            <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1 font-inter">
              <li>Both transactions bundled into a single Algorand Group ID.</li>
              <li><strong>All-or-Nothing Guarantee:</strong> If provider 2 fails or timeouts, provider 1 settlement is automatically reverted on-chain.</li>
              <li><strong>Zero ALGO Required:</strong> Gas fee (0.002 ALGO total for 2 txns) is sponsored by Route402 Sponsor Vault.</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-zinc-800 hover:bg-[#121215] text-xs font-semibold text-zinc-300 rounded-xl font-inter cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={isSimulating}
            onClick={() => {
              onExecuteComposite(step1Provider, step2Provider);
              onClose();
            }}
            className="px-5 py-2 bg-[#FF0A16] hover:bg-[#E60000] text-white font-semibold text-xs rounded-xl flex items-center gap-2 font-inter shadow-[0_0_15px_rgba(255,10,22,0.3)] cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-amber-400" /> Execute Atomic Group Task
          </button>
        </div>
      </div>
    </div>
  );
};
