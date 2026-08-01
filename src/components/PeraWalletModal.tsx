import React, { useState } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import {
  Wallet,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Key,
  Coins,
  ArrowUpRight,
} from 'lucide-react';

interface PeraWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (address: string) => void;
  network: 'testnet' | 'mainnet';
}

let peraWalletInstance: PeraWalletConnect | null = null;

function getPeraWalletInstance(): PeraWalletConnect {
  if (!peraWalletInstance) {
    peraWalletInstance = new PeraWalletConnect({
      shouldShowSignTxnToast: true,
    });
  }
  return peraWalletInstance;
}

export const PeraWalletModal: React.FC<PeraWalletModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  network,
}) => {
  const [inputAddress, setInputAddress] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pera_connect' | 'address_input'>('pera_connect');

  if (!isOpen) return null;

  const handlePeraSdkConnect = async () => {
    setIsConnecting(true);
    setErrorMsg(null);

    try {
      const peraWallet = getPeraWalletInstance();
      const accounts = await peraWallet.connect();

      // Handle disconnect event on wallet session termination
      peraWallet.connector?.on('disconnect', () => {
        // Disconnected session
      });

      if (accounts && accounts.length > 0) {
        onConnect(accounts[0]);
        onClose();
      } else {
        setErrorMsg('No accounts selected from Pera Wallet.');
      }
    } catch (err: any) {
      if (err?.data?.type !== 'CONNECT_MODAL_CLOSED') {
        console.error('[Pera Connect Error]', err);
        setErrorMsg(err?.message || 'Failed to connect Pera Wallet session.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManualAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAddr = inputAddress.trim();

    if (cleanAddr.length < 50) {
      setErrorMsg('Please enter a valid 58-character Algorand address.');
      return;
    }

    onConnect(cleanAddr);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#09090b] rounded-2xl max-w-md w-full border border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-[#121215]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF0A16]/10 border border-[#FF0A16]/30 flex items-center justify-center text-[#FF0A16]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">
                Connect Pera Wallet
              </h3>
              <p className="text-[11px] text-zinc-400 font-inter">
                Algorand {network === 'testnet' ? 'TestNet' : 'MainNet'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-800 text-xs font-medium font-inter bg-[#050505]">
          <button
            onClick={() => {
              setActiveTab('pera_connect');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 px-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'pera_connect'
                ? 'border-[#FF0A16] text-white font-semibold bg-[#121215]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <QrCode className="w-4 h-4 text-[#FF0A16]" /> Pera App / Web
          </button>
          <button
            onClick={() => {
              setActiveTab('address_input');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 px-4 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'address_input'
                ? 'border-[#FF0A16] text-white font-semibold bg-[#121215]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Key className="w-4 h-4 text-zinc-400" /> Enter Address
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs font-inter">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'pera_connect' ? (
            <div className="space-y-4 text-center">
              <div className="p-6 rounded-2xl bg-[#050505] border border-zinc-800/80 flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-[#FFE600]/10 border border-[#FFE600]/30 flex items-center justify-center text-[#FFE600]">
                  <Wallet className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Official Pera Wallet SDK</h4>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Scan QR code with Pera Wallet Mobile App or pair with Pera Web Extension.
                  </p>
                </div>
                <button
                  onClick={handlePeraSdkConnect}
                  disabled={isConnecting}
                  className="w-full py-3 px-4 mt-2 bg-[#FFE600] hover:bg-[#E6CE00] text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,230,0,0.2)] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Wallet className="w-4 h-4" />
                  {isConnecting ? 'Opening Pera Connect...' : 'Launch Pera Wallet SDK'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleManualAddressSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">
                  Algorand Testnet Address
                </label>
                <input
                  type="text"
                  value={inputAddress}
                  onChange={(e) => setInputAddress(e.target.value)}
                  placeholder="e.g. WMG2XO3YBT3272YAOMVT6ZVRIES3B2GN..."
                  className="w-full bg-[#050505] border border-zinc-800 rounded-xl p-3 font-mono text-[11px] text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#FF0A16] focus:border-[#FF0A16]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#FF0A16] hover:bg-[#E60000] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,10,22,0.3)] transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Connect Address
              </button>
            </form>
          )}

          {/* Testnet Dispenser quick reference link */}
          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-[#FF5C5C]" /> Need Testnet ALGOs?
            </span>
            <a
              href="https://lora.algokit.io/testnet/fund"
              target="_blank"
              rel="noreferrer"
              className="text-[#FF5C5C] hover:text-white font-semibold flex items-center gap-1 transition-colors"
            >
              AlgoKit Lora Dispenser <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
