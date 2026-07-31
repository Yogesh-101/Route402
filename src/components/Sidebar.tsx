import React from 'react';
import {
  LayoutDashboard,
  Server,
  Route,
  Receipt,
  BarChart3,
  Flame,
  Settings,
  Shield,
  Zap,
  Layers,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'providers'
  | 'router'
  | 'transactions'
  | 'analytics'
  | 'chaos'
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  openCompositeModal: () => void;
  circuitOpenCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openCompositeModal,
  circuitOpenCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'providers',
      label: 'Providers',
      icon: Server,
      badge: circuitOpenCount > 0 ? `${circuitOpenCount} Open` : undefined,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    { id: 'router', label: 'AI Router & Scorer', icon: Route },
    { id: 'transactions', label: 'Settlement Ledger', icon: Receipt },
    { id: 'analytics', label: 'Savings Analytics', icon: BarChart3 },
    { id: 'chaos', label: 'Chaos & Test Harness', icon: Flame },
    { id: 'settings', label: 'Settings & Config', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#050505] text-zinc-100 flex flex-col h-screen sticky top-0 border-r border-zinc-800/80 z-20 select-none">
      {/* Logo Header */}
      <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF0A16] to-[#7D0000] flex items-center justify-center shadow-lg shadow-red-950/50 text-white font-bold text-lg font-display border border-red-500/30">
            402
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight font-display text-white">
                Route<span className="text-[#FF0A16]">402</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono-num font-semibold bg-[#FF0A16]/15 text-[#FF5C5C] border border-[#FF0A16]/30 rounded">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-inter">x402 Agent Payment Router</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase font-mono-num">
          Core Engine
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#FF0A16] text-white font-semibold shadow-md shadow-red-950/60'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#121215]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-white' : 'text-zinc-400'
                  }`}
                />
                <span className="font-inter">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono-num font-medium rounded-full ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Feature Highlight Box */}
        <div className="pt-6 px-1">
          <div className="p-3.5 rounded-2xl bg-[#09090b] border border-zinc-800 text-xs text-zinc-300 space-y-2">
            <div className="flex items-center justify-between text-[#FF5C5C] font-semibold font-mono-num">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Atomic Grouping
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                P1 Demo
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-inter">
              Execute multi-provider agent workflows (Summarize + Review) in a single Algorand atomic transaction group.
            </p>
            <button
              onClick={openCompositeModal}
              className="w-full mt-1.5 px-3 py-1.5 rounded-lg bg-[#FF0A16]/15 hover:bg-[#FF0A16]/25 text-[#FF5C5C] font-medium text-[11px] border border-[#FF0A16]/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Zap className="w-3 h-3 text-amber-400" /> Run Composite Request
            </button>
          </div>
        </div>
      </nav>

      {/* Network & Wallet Footer */}
      <div className="p-4 border-t border-zinc-800/80 bg-[#09090b]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-zinc-300 font-inter">
              Algorand TestNet
            </span>
          </div>
          <span className="text-[10px] font-mono-num text-zinc-400 bg-[#121215] px-1.5 py-0.5 rounded border border-zinc-800">
            x402 Active
          </span>
        </div>
        <div className="text-[11px] font-mono-num text-zinc-400 flex items-center justify-between">
          <span className="flex items-center gap-1 text-zinc-400">
            <Shield className="w-3 h-3 text-[#FF5C5C]" /> Sponsor Gas
          </span>
          <span className="text-emerald-400 font-medium">Fee Abstraction ON</span>
        </div>
      </div>
    </aside>
  );
};
