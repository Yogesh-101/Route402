import React from 'react';
import {
  Search,
  Wallet,
  Globe,
  Radio,
  Plus,
  Zap,
  ArrowRightLeft,
  CheckCircle2,
} from 'lucide-react';

interface NavbarProps {
  network: 'testnet' | 'mainnet';
  setNetwork: (network: 'testnet' | 'mainnet') => void;
  openAgentModal: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  network,
  setNetwork,
  openAgentModal,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <header className="h-16 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800/80 px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decisions, providers, capabilities, TX IDs..."
            className="w-full bg-[#121215] border border-zinc-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#FF0A16] focus:border-[#FF0A16]/50 font-inter transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Stream Status */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#121215] border border-zinc-800 text-xs font-inter text-zinc-300">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono-num font-medium text-zinc-200">
            GoPlausible x402 Facilitator
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </div>

        {/* Network Selector */}
        <div className="flex items-center bg-[#121215] border border-zinc-800 p-0.5 rounded-lg text-xs font-medium font-mono-num">
          <button
            onClick={() => setNetwork('testnet')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              network === 'testnet'
                ? 'bg-[#FF0A16] text-white font-semibold shadow-xs shadow-red-900/40'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            TestNet
          </button>
          <button
            onClick={() => setNetwork('mainnet')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              network === 'mainnet'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs shadow-emerald-900/40'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            MainNet
          </button>
        </div>

        {/* Wallet Balance Display */}
        <div className="flex items-center gap-2.5 bg-[#121215] border border-zinc-800 px-3 py-1.5 rounded-xl">
          <Wallet className="w-4 h-4 text-[#FF0A16]" />
          <div className="flex items-center gap-3 text-xs">
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase font-mono-num font-semibold">
                Agent Balance
              </span>
              <span className="font-mono-num font-semibold text-zinc-200">
                0.00 <span className="text-[10px] text-zinc-400">ALGO</span> | $4.25 <span className="text-[10px] text-[#FF5C5C]">USDC</span>
              </span>
            </div>
            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold rounded font-mono-num flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Fee Sponsored
            </span>
          </div>
        </div>

        {/* Quick Action Button */}
        <button
          onClick={openAgentModal}
          className="flex items-center gap-2 bg-[#FF0A16] hover:bg-[#E60000] text-white px-3.5 py-2 rounded-xl text-xs font-semibold font-inter shadow-[0_0_15px_rgba(255,10,22,0.3)] transition-all active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Agent Request</span>
        </button>
      </div>
    </header>
  );
};
