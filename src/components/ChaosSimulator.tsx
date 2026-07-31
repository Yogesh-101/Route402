import React, { useState } from 'react';
import {
  Flame,
  Zap,
  Play,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  Clock,
  XCircle,
  CheckCircle2,
  Sliders,
  Send,
  Layers,
} from 'lucide-react';
import { Provider, CapabilityType, PriorityProfile, ChaosMode } from '../types';

interface ChaosSimulatorProps {
  providers: Provider[];
  onTriggerRequest: (
    capability: CapabilityType,
    priority: PriorityProfile,
    maxPrice?: number
  ) => void;
  onTriggerBurst: (count: number) => void;
  onSetChaos: (providerId: string, mode: ChaosMode) => void;
  onResetAllChaos: () => void;
  isSimulating: boolean;
}

export const ChaosSimulator: React.FC<ChaosSimulatorProps> = ({
  providers,
  onTriggerRequest,
  onTriggerBurst,
  onSetChaos,
  onResetAllChaos,
  isSimulating,
}) => {
  const [capability, setCapability] = useState<CapabilityType>('text.summarize');
  const [priority, setPriority] = useState<PriorityProfile>('balanced');
  const [maxPrice, setMaxPrice] = useState<number>(20000);

  return (
    <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-6 shadow-card mb-6">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-800/80">
        <div>
          <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            Chaos Engineering & Traffic Generator
          </h3>
          <p className="text-xs text-zinc-400 font-inter mt-0.5">
            Test live circuit breakers, payment refusal guards, latency re-weighting, and auto re-routing under load.
          </p>
        </div>

        <button
          onClick={onResetAllChaos}
          className="px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-[#121215] text-xs font-semibold font-mono-num text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Restore All Providers
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Request Generator */}
        <div className="p-4 rounded-xl bg-[#121215] border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-white font-mono-num uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-[#FF5C5C]" /> Agent Request Config
          </div>

          <div className="space-y-3 text-xs font-inter">
            {/* Capability Picker */}
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Target Capability</label>
              <select
                value={capability}
                onChange={(e) => setCapability(e.target.value as CapabilityType)}
                className="w-full bg-[#050505] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono-num text-zinc-100 focus:ring-1 focus:ring-[#FF0A16]"
              >
                <option value="text.summarize">text.summarize (Text Summarization)</option>
                <option value="code.review">code.review (Security Code Audit)</option>
                <option value="image.generate">image.generate (Generative Visuals)</option>
                <option value="audio.transcribe">audio.transcribe (Audio Transcription)</option>
              </select>
            </div>

            {/* Priority Weighting */}
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Priority Weighting Profile</label>
              <div className="grid grid-cols-3 gap-2 font-mono-num">
                {(['cost', 'speed', 'balanced'] as PriorityProfile[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                      priority === p
                        ? 'bg-[#FF0A16] text-white border-[#FF0A16]'
                        : 'bg-[#050505] text-zinc-400 border-zinc-800 hover:bg-[#18181b]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Ceiling */}
            <div>
              <div className="flex justify-between text-zinc-400 font-medium mb-1">
                <span>Max Price Ceiling</span>
                <span className="font-mono-num font-bold text-[#FF5C5C]">
                  {maxPrice.toLocaleString()} µUSDC (${(maxPrice / 1000000).toFixed(3)})
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="40000"
                step="1000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#FF0A16] cursor-pointer"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              disabled={isSimulating}
              onClick={() => onTriggerRequest(capability, priority, maxPrice)}
              className="flex-1 py-2.5 px-4 bg-[#FF0A16] hover:bg-[#E60000] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer font-inter shadow-[0_0_15px_rgba(255,10,22,0.3)]"
            >
              <Send className="w-4 h-4" /> Send Single Request
            </button>

            <button
              disabled={isSimulating}
              onClick={() => onTriggerBurst(10)}
              className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer font-mono-num border border-zinc-700"
            >
              <Zap className="w-4 h-4 text-amber-400" /> Burst (10x Load)
            </button>
          </div>
        </div>

        {/* Right Column: Live Chaos Injector */}
        <div className="p-4 rounded-xl bg-[#121215] border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white font-mono-num uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-red-500" /> Provider Chaos Matrix
            </div>
            <span className="text-[10px] text-zinc-500 font-mono-num">
              Simulate Live Downtime
            </span>
          </div>

          <div className="space-y-2">
            {providers.map((p) => {
              const isCircuitOpen = p.circuitState === 'open';

              return (
                <div
                  key={p.id}
                  className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-all ${
                    isCircuitOpen
                      ? 'bg-red-950/40 border-red-800/80'
                      : 'bg-[#050505] border-zinc-800'
                  }`}
                >
                  <div>
                    <div className="font-bold text-zinc-100 font-display flex items-center gap-2">
                      {p.name}
                      {isCircuitOpen && (
                        <span className="px-1.5 py-0.5 text-[9px] bg-red-600 text-white rounded font-mono-num">
                          CIRCUIT OPEN
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono-num">
                      {p.advertisedPriceMicroUSDC.toLocaleString()} µUSDC | {p.latencyP50Ms}ms P50
                    </div>
                  </div>

                  <div className="flex items-center gap-1 font-mono-num">
                    <button
                      onClick={() =>
                        onSetChaos(p.id, p.chaosMode === 'slow' ? 'healthy' : 'slow')
                      }
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                        p.chaosMode === 'slow'
                          ? 'bg-amber-600 text-white'
                          : 'bg-[#121215] text-zinc-300 border border-zinc-800 hover:bg-amber-950/40 hover:text-amber-400'
                      }`}
                    >
                      +Latency
                    </button>
                    <button
                      onClick={() =>
                        onSetChaos(p.id, p.chaosMode === 'corrupt' ? 'healthy' : 'corrupt')
                      }
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                        p.chaosMode === 'corrupt'
                          ? 'bg-red-600 text-white'
                          : 'bg-[#121215] text-zinc-300 border border-zinc-800 hover:bg-red-950/40 hover:text-red-400'
                      }`}
                    >
                      Corrupt
                    </button>
                    <button
                      onClick={() =>
                        onSetChaos(p.id, p.chaosMode === 'offline' ? 'healthy' : 'offline')
                      }
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                        p.chaosMode === 'offline'
                          ? 'bg-zinc-800 text-white'
                          : 'bg-[#121215] text-zinc-300 border border-zinc-800 hover:bg-zinc-800'
                      }`}
                    >
                      Kill
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
