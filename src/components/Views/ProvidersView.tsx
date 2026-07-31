import React, { useState } from 'react';
import {
  Server,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  Clock,
  RotateCcw,
  Flame,
} from 'lucide-react';
import { ProviderCard } from '../ProviderCard';
import { Provider, CapabilityType, ChaosMode } from '../../types';

interface ProvidersViewProps {
  providers: Provider[];
  onSetChaos: (providerId: string, mode: ChaosMode) => void;
  onResetCircuit: (providerId: string) => void;
  onAddProvider: (newProv: Partial<Provider>) => void;
}

export const ProvidersView: React.FC<ProvidersViewProps> = ({
  providers,
  onSetChaos,
  onResetCircuit,
  onAddProvider,
}) => {
  const [selectedCap, setSelectedCap] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for new provider
  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [price, setPrice] = useState(10000);
  const [cap, setCap] = useState<CapabilityType>('text.summarize');

  const filteredProviders = providers.filter((p) => {
    if (selectedCap === 'all') return true;
    return p.capabilities.includes(selectedCap as CapabilityType);
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !endpoint) return;

    onAddProvider({
      name,
      endpoint,
      capabilities: [cap],
      advertisedPriceMicroUSDC: Number(price),
    });

    setName('');
    setEndpoint('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#09090b] border border-zinc-800/80 rounded-2xl p-6 shadow-card">
        <div>
          <h2 className="text-xl font-bold text-white font-display">
            Provider Pool Registry
          </h2>
          <p className="text-xs text-zinc-400 font-inter mt-1">
            Registered x402 resource servers providing AI capabilities on Algorand. Monitored for real-time latency, price, and success rates.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#FF0A16] hover:bg-[#E60000] text-white px-4 py-2 rounded-xl text-xs font-semibold font-inter shadow-[0_0_15px_rgba(255,10,22,0.3)] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Register x402 Provider
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 text-xs font-mono-num font-semibold">
        {['all', 'text.summarize', 'code.review', 'image.generate', 'audio.transcribe', 'data.enrichment'].map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCap(c)}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              selectedCap === c
                ? 'bg-[#FF0A16] text-white border-[#FF0A16]'
                : 'bg-[#09090b] text-zinc-400 border-zinc-800 hover:bg-[#121215]'
            }`}
          >
            {c === 'all' ? 'All Capabilities' : c}
          </button>
        ))}
      </div>

      {/* Provider Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProviders.map((p) => (
          <ProviderCard
            key={p.id}
            provider={p}
            onSetChaos={onSetChaos}
            onResetCircuit={onResetCircuit}
          />
        ))}
      </div>

      {/* Register Provider Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#09090b] rounded-2xl max-w-md w-full border border-zinc-800 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <h3 className="text-base font-bold text-white font-display">
                Register New x402 Provider
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs font-inter">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Provider Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zeta Deep AI"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#050505] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-inter text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">x402 Endpoint URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.zeta.ai/v1/x402"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="w-full bg-[#050505] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono-num text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Primary Capability</label>
                <select
                  value={cap}
                  onChange={(e) => setCap(e.target.value as CapabilityType)}
                  className="w-full bg-[#050505] border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono-num text-zinc-100"
                >
                  <option value="text.summarize">text.summarize</option>
                  <option value="code.review">code.review</option>
                  <option value="image.generate">image.generate</option>
                  <option value="audio.transcribe">audio.transcribe</option>
                  <option value="data.enrichment">data.enrichment</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">
                  Advertised Price: <strong className="font-mono-num text-[#FF5C5C]">{price.toLocaleString()} µUSDC</strong> (${(price / 1000000).toFixed(3)})
                </label>
                <input
                  type="range"
                  min="2000"
                  max="50000"
                  step="1000"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full accent-[#FF0A16] cursor-pointer"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-zinc-800 rounded-xl text-zinc-300 font-semibold text-xs hover:bg-[#121215] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF0A16] hover:bg-[#E60000] text-white font-semibold text-xs rounded-xl shadow-[0_0_15px_rgba(255,10,22,0.3)] cursor-pointer"
                >
                  Register Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
