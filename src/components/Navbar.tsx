import React, { useState } from 'react';
import {
  Search,
  Wallet,
  Globe,
  Radio,
  Plus,
  Zap,
  CheckCircle2,
  LogOut,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

interface NavbarProps {
  network: 'testnet' | 'mainnet';
  setNetwork: (network: 'testnet' | 'mainnet') => void;
  openAgentModal: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  connectedWallet: string | null;
  walletAccountName?: string;
  setWalletAccountName?: (name: string) => void;
  walletAlgoBalance: number;
  walletUsdcBalance: number;
  openPeraModal: () => void;
  onDisconnectWallet: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  network,
  setNetwork,
  openAgentModal,
  searchQuery,
  setSearchQuery,
  connectedWallet,
  walletAccountName = 'Pera Account 1',
  setWalletAccountName,
  walletAlgoBalance,
  walletUsdcBalance,
  openPeraModal,
  onDisconnectWallet,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const formatAddress = (addr: string) => {
    if (addr.length < 12) return addr;
    return `${addr.substring(0, 5)}...${addr.substring(addr.length - 4)}`;
  };

  const handleCopy = () => {
    if (connectedWallet) {
      navigator.clipboard.writeText(connectedWallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              network === 'testnet'
                ? 'bg-[#FF0A16] text-white font-semibold shadow-xs shadow-red-900/40'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            TestNet
          </button>
          <button
            onClick={() => setNetwork('mainnet')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              network === 'mainnet'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs shadow-emerald-900/40'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            MainNet
          </button>
        </div>

        {/* Pera Wallet Integration Container */}
        {connectedWallet ? (
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2.5 bg-[#121215] hover:bg-[#18181c] border border-amber-500/30 hover:border-amber-500/60 px-3 py-1.5 rounded-xl transition-all cursor-pointer text-xs font-inter group"
            >
              {/* Pera Yellow Wallet Icon */}
              <div className="w-5 h-5 rounded-lg bg-[#FFE600] flex items-center justify-center text-zinc-950 font-bold shadow-xs">
                <Wallet className="w-3.5 h-3.5" />
              </div>

              <div className="text-left font-mono-num">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-[11px] flex items-center gap-1">
                    <span className="text-amber-400 font-display">{walletAccountName}</span> ({formatAddress(connectedWallet)})
                  </span>
                  <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-semibold rounded font-mono-num flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Pera
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-semibold block">
                  {walletAlgoBalance.toFixed(2)}{' '}
                  <span className="text-[9px] text-amber-400">ALGO</span> | $
                  {walletUsdcBalance.toFixed(2)}{' '}
                  <span className="text-[9px] text-[#FF5C5C]">USDC</span>
                </span>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-transform" />
            </button>

            {/* Wallet Options Popover Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl p-3 z-50 text-xs font-inter space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-2.5 bg-[#050505] rounded-lg border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono-num">
                    <span className="text-amber-400 uppercase font-bold">Account Name:</span>
                    <input
                      type="text"
                      value={walletAccountName}
                      onChange={(e) => setWalletAccountName && setWalletAccountName(e.target.value)}
                      placeholder="e.g. Yogesh Main"
                      title="Edit Account Name"
                      className="bg-[#121215] border border-zinc-700 focus:border-amber-400 rounded px-2 py-0.5 text-white text-xs font-semibold text-right focus:outline-none max-w-[130px] font-display"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono-num font-bold block mt-1">
                    Pera Wallet Address
                  </span>
                  <div className="flex items-center justify-between text-zinc-200 font-mono text-[11px] break-all">
                    <span>{formatAddress(connectedWallet)}</span>
                    <button
                      onClick={handleCopy}
                      className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy Address"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1 text-zinc-400 text-[11px]">
                  <span>Lora Explorer:</span>
                  <a
                    href={`https://lora.algokit.io/${network}/account/${connectedWallet}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#FF5C5C] hover:underline flex items-center gap-1 font-semibold"
                  >
                    View Account <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDisconnectWallet();
                  }}
                  className="w-full py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Disconnect Pera Wallet
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={openPeraModal}
            className="flex items-center gap-2 bg-[#FFE600] hover:bg-[#E6CE00] text-zinc-950 font-bold px-3.5 py-1.5 rounded-xl text-xs font-inter shadow-[0_0_15px_rgba(255,230,0,0.25)] transition-all active:scale-98 cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-zinc-950" />
            <span>Connect Pera Wallet</span>
          </button>
        )}

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
