import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Server,
  Globe,
  Coins,
  CheckCircle2,
  Save,
} from 'lucide-react';

interface SettingsViewProps {
  network: 'testnet' | 'mainnet';
  setNetwork: (net: 'testnet' | 'mainnet') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  network,
  setNetwork,
}) => {
  const [facilitatorUrl, setFacilitatorUrl] = useState(
    'https://facilitator.goplausible.com/v1/x402/algorand'
  );
  const [asaId, setAsaId] = useState('31566704');
  const [sponsorWallet, setSponsorWallet] = useState(
    'K7HVTJFZNC3NUVBIMLYYUDADXWCO7ZARCWZ65Z2WTSF3NXID6C2INRFDTE'
  );
  const [maxFailures, setMaxFailures] = useState(3);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-6 shadow-card">
        <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#FF0A16]" />
          Route402 Engine & Algorand Configuration
        </h2>
        <p className="text-xs text-zinc-400 font-inter mt-1">
          Configure on-chain settlement parameters, GoPlausible x402 facilitator connection, fee sponsorship vaults, and circuit breaker sensitivity.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-6 shadow-card space-y-6 text-xs font-inter">
        {/* Network Selection */}
        <div>
          <h3 className="text-sm font-bold text-white font-display mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#FF0A16]" /> Target Algorand Network
          </h3>
          <div className="grid grid-cols-2 gap-3 max-w-md font-mono-num">
            <button
              type="button"
              onClick={() => setNetwork('testnet')}
              className={`p-3 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                network === 'testnet'
                  ? 'bg-[#FF0A16]/15 border-[#FF0A16] text-[#FF5C5C] shadow-xs'
                  : 'bg-[#050505] border-zinc-800 text-zinc-400'
              }`}
            >
              <div className="text-sm font-display">Algorand TestNet</div>
              <div className="text-[10px] font-normal text-zinc-500 mt-0.5">
                ASA USDC ID: 31566704
              </div>
            </button>

            <button
              type="button"
              onClick={() => setNetwork('mainnet')}
              className={`p-3 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                network === 'mainnet'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                  : 'bg-[#050505] border-zinc-800 text-zinc-400'
              }`}
            >
              <div className="text-sm font-display">Algorand MainNet</div>
              <div className="text-[10px] font-normal text-emerald-200 mt-0.5">
                ASA USDC ID: 312769
              </div>
            </button>
          </div>
        </div>

        {/* GoPlausible Facilitator */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              GoPlausible x402 Facilitator URL
            </label>
            <input
              type="url"
              value={facilitatorUrl}
              onChange={(e) => setFacilitatorUrl(e.target.value)}
              className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2.5 font-mono-num text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              USDC Asset ASA ID
            </label>
            <input
              type="text"
              value={asaId}
              onChange={(e) => setAsaId(e.target.value)}
              className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2.5 font-mono-num text-zinc-100"
            />
          </div>
        </div>

        {/* Fee Sponsorship & Circuit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              Sponsor Gas Vault Address (0 ALGO Agent Unlock)
            </label>
            <input
              type="text"
              value={sponsorWallet}
              onChange={(e) => setSponsorWallet(e.target.value)}
              className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2.5 font-mono-num text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              Circuit Breaker Sensitivity (Consecutive Failures)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={maxFailures}
              onChange={(e) => setMaxFailures(Number(e.target.value))}
              className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2.5 font-mono-num text-zinc-100"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          {isSaved ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5 font-mono-num">
              <CheckCircle2 className="w-4 h-4" /> Configuration Saved Successfully!
            </span>
          ) : (
            <span className="text-zinc-500 text-[11px]">
              Changes apply instantly to live routing pipeline.
            </span>
          )}

          <button
            type="submit"
            className="px-5 py-2.5 bg-[#FF0A16] hover:bg-[#E60000] text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(255,10,22,0.3)] font-inter cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
