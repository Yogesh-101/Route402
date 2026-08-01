import React, { useState } from 'react';
import {
  Receipt,
  ExternalLink,
  ShieldCheck,
  XCircle,
  Clock,
  Code,
  CheckCircle2,
  FileCode,
  ArrowUpRight,
} from 'lucide-react';
import { PaymentRecord } from '../types';

interface SettlementLedgerTableProps {
  payments: PaymentRecord[];
}

export const SettlementLedgerTable: React.FC<SettlementLedgerTableProps> = ({
  payments,
}) => {
  const [selectedTx, setSelectedTx] = useState<PaymentRecord | null>(null);

  return (
    <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl p-6 shadow-card mb-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/80">
        <div>
          <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#FF0A16]" />
            Algorand Settlement Ledger (x402 Protocol)
          </h3>
          <p className="text-xs text-zinc-400 font-inter mt-0.5">
            Immutable settlement audit trail on Algorand TestNet/MainNet. Features zero-gas fee sponsorship and instant HTTP finality.
          </p>
        </div>
        <span className="text-xs font-mono-num font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
          {payments.filter((p) => p.status === 'settled').length} Settled
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-inter border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-[#050505] text-zinc-400 font-mono-num text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Provider</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Fee Sponsor</th>
              <th className="py-3 px-4">Finality</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">On-Chain Explorer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-zinc-500">
                  No settlement records found.
                </td>
              </tr>
            ) : (
              payments.map((payment) => {
                const timeAgo = payment.settledAt
                  ? `${Math.max(0, Math.round((Date.now() - payment.settledAt) / 1000))}s ago`
                  : 'Pending';

                const formattedPrice = (payment.amountMicroUSDC / 1000000).toFixed(4);

                return (
                  <tr
                    key={payment.id}
                    className="hover:bg-[#121215] transition-colors group cursor-pointer"
                    onClick={() => setSelectedTx(payment)}
                  >
                    <td className="py-3 px-4 font-mono-num text-zinc-400">
                      {timeAgo}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-100 font-display">
                        {payment.providerName}
                      </div>
                      <div className="text-[10px] font-mono-num text-zinc-500">
                        {payment.providerId}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono-num font-bold text-white">
                      ${formattedPrice} <span className="text-[10px] font-normal text-zinc-400">USDC</span>
                    </td>

                    <td className="py-3 px-4 font-mono-num">
                      {payment.feeSponsored ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" /> Sponsored (0 ALGO)
                        </span>
                      ) : (
                        <span className="text-zinc-400">Standard</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono-num text-zinc-200">
                      {payment.finalityMs ? `${(payment.finalityMs / 1000).toFixed(2)}s` : 'N/A'}
                    </td>

                    <td className="py-3 px-4">
                      {payment.status === 'settled' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono-num">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Settled
                        </span>
                      )}
                      {payment.status === 'refused' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20 font-mono-num">
                          <XCircle className="w-3 h-3 text-red-400" /> Refused Unpaid
                        </span>
                      )}
                      {payment.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-mono-num">
                          <Clock className="w-3 h-3 text-amber-400" /> Negotiating
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono-num">
                      {payment.explorerUrl ? (
                        <a
                          href={payment.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF5C5C] hover:underline"
                        >
                          Explorer <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-zinc-500 text-[11px]">No On-Chain Settlement</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* x402 Header Inspector Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#09090b] rounded-2xl max-w-lg w-full border border-zinc-800 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#FF0A16]" />
                <h3 className="text-base font-bold text-white font-display">
                  x402 Payment Negotiation Spec
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-zinc-400 hover:text-white font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 font-mono-num text-xs">
              <div className="p-3 bg-[#050505] text-emerald-400 border border-zinc-800 rounded-xl overflow-x-auto font-code text-[11px] leading-relaxed">
                <pre>{`HTTP/1.1 402 Payment Required
x402-Version: 1
Content-Type: application/json

{
  "x402Version": 1,
  "accepts": [{
    "scheme": "exact",
    "network": "algorand-testnet",
    "maxAmountRequired": "${selectedTx.amountMicroUSDC}",
    "asset": "31566704", // USDC ASA
    "payTo": "BETAX402SPEEDRUNNER4590123456...",
    "resource": "/summarize",
    "maxTimeoutSeconds": 30
  }],
  "feeSponsor": {
    "address": "ROUTE402SPONSOR348123...",
    "maxSponsorFee": "1000" // 0.001 ALGO
  }
}`}</pre>
              </div>

              <div className="p-3 bg-[#121215] border border-zinc-800 rounded-xl space-y-2 text-zinc-100">
                <div className="text-[11px] font-bold text-amber-400 border-b border-zinc-800/80 pb-1.5 uppercase tracking-wider">
                  Wallet Owners & Settlement Roles
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400">Agent Wallet Owner (USDC Payer):</span>
                  <span className="font-semibold text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    AI Client Agent (User)
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400">Provider Wallet Owner (Receiver):</span>
                  <span className="font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                    {selectedTx.providerName} Treasury Vault
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400">Gas Sponsor Vault Owner:</span>
                  <span className="font-semibold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                    Route402 Sponsor Fee Vault
                  </span>
                </div>

                <div className="flex justify-between pt-1 border-t border-zinc-800/80">
                  <span className="text-zinc-400">Settlement Status:</span>
                  <span className="font-bold uppercase text-[#FF5C5C]">{selectedTx.status}</span>
                </div>
                {selectedTx.refusedReason && (
                  <div className="text-red-400 font-semibold pt-1 border-t border-zinc-800">
                    {selectedTx.refusedReason}
                  </div>
                )}
                {selectedTx.groupId && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Atomic Group ID:</span>
                    <span className="text-[10px] font-bold truncate max-w-[200px] text-zinc-200">
                      {selectedTx.groupId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-[#FF0A16] hover:bg-[#E60000] text-white font-semibold text-xs rounded-xl font-inter cursor-pointer"
              >
                Close Header View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
