import React from 'react';
import { HeroMetrics } from '../HeroMetrics';
import { RoutingVisualization } from '../RoutingVisualization';
import { ProviderCard } from '../ProviderCard';
import { DecisionFeed } from '../DecisionFeed';
import { SettlementLedgerTable } from '../SettlementLedgerTable';
import { Provider, RouteDecision, PaymentRecord, SavingsSnapshot, ChaosMode } from '../../types';

interface DashboardViewProps {
  stats: SavingsSnapshot;
  providers: Provider[];
  decisions: RouteDecision[];
  payments: PaymentRecord[];
  onSetChaos: (providerId: string, mode: ChaosMode) => void;
  onResetCircuit: (providerId: string) => void;
  onOpenAnalytics: () => void;
  isSimulating: boolean;
  activeSimStep: number;
  simTargetName?: string;
  simCapability?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  providers,
  decisions,
  payments,
  onSetChaos,
  onResetCircuit,
  onOpenAnalytics,
  isSimulating,
  activeSimStep,
  simTargetName,
  simCapability,
}) => {
  return (
    <div className="space-y-6">
      {/* Hero KPI Cards */}
      <HeroMetrics stats={stats} onOpenAnalytics={onOpenAnalytics} />

      {/* AI Routing Pipeline Visualization */}
      <RoutingVisualization
        selectedProviderName={simTargetName || decisions[0]?.selectedProviderName || 'Beta FastSummarize'}
        activeStep={activeSimStep}
        capability={simCapability || decisions[0]?.capability || 'text.summarize'}
        isSimulating={isSimulating}
      />

      {/* Provider Cards Strip */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-white font-display">
            Active Provider Health & Latency
          </h3>
          <span className="text-xs text-zinc-400 font-mono-num font-medium">
            {providers.length} Registered Providers
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.slice(0, 3).map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              onSetChaos={onSetChaos}
              onResetCircuit={onResetCircuit}
            />
          ))}
        </div>
      </div>

      {/* Decision Feed Log */}
      <DecisionFeed decisions={decisions} />

      {/* Settlement Ledger Table */}
      <SettlementLedgerTable payments={payments} />
    </div>
  );
};
