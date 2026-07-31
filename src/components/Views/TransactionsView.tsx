import React, { useState } from 'react';
import { SettlementLedgerTable } from '../SettlementLedgerTable';
import { PaymentRecord } from '../../types';
import { Receipt, Search, Filter } from 'lucide-react';

interface TransactionsViewProps {
  payments: PaymentRecord[];
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ payments }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredPayments = payments.filter((p) => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#09090b] border border-zinc-800/80 rounded-2xl p-6 shadow-card">
        <div>
          <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#FF0A16]" />
            Algorand Settlement Ledger & Audit Log
          </h2>
          <p className="text-xs text-zinc-400 font-inter mt-1">
            Complete list of x402 payment settlements on Algorand. Every transaction is verifiable on-chain with instant finality.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-[#121215] border border-zinc-800 p-1 rounded-xl text-xs font-mono-num font-semibold">
          {['all', 'settled', 'refused', 'pending'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                filterStatus === s
                  ? 'bg-[#FF0A16] text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <SettlementLedgerTable payments={filteredPayments} />
    </div>
  );
};
