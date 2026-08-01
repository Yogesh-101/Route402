/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar, TabType } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/Views/DashboardView';
import { ProvidersView } from './components/Views/ProvidersView';
import { RouterView } from './components/Views/RouterView';
import { TransactionsView } from './components/Views/TransactionsView';
import { AnalyticsView } from './components/Views/AnalyticsView';
import { SettingsView } from './components/Views/SettingsView';
import { ChaosSimulator } from './components/ChaosSimulator';
import { CompositeTaskModal } from './components/CompositeTaskModal';
import { PeraWalletModal } from './components/PeraWalletModal';
import { PeraWalletConnect } from '@perawallet/connect';

import {
  INITIAL_PROVIDERS,
  INITIAL_DECISIONS,
  INITIAL_PAYMENTS,
  INITIAL_EVENTS,
} from './data/initialData';

import {
  Provider,
  RouteDecision,
  PaymentRecord,
  SystemEvent,
  CapabilityType,
  PriorityProfile,
  ChaosMode,
  ScoredCandidate,
} from './types';

import {
  evaluateAndScoreCandidates,
  generateDecisionExplanation,
  generateTxHash,
  computeSavings,
} from './lib/routingEngine';
import {
  sendPeraPaymentTransaction,
  sendPeraCompositeTransaction,
  getPeraWallet,
} from './lib/peraWallet';

import { Play, X, Sliders, Send, Zap, Bot } from 'lucide-react';

const API_BASE = 'http://localhost:4000/v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pera Wallet Connected State & Live Balances
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [walletAccountName, setWalletAccountNameState] = useState<string>(() => {
    return localStorage.getItem('route402_pera_account_name') || 'Pera Account 1';
  });

  const setWalletAccountName = (name: string) => {
    setWalletAccountNameState(name);
    localStorage.setItem('route402_pera_account_name', name);
  };

  const [walletAlgoBalance, setWalletAlgoBalance] = useState<number>(0);
  const [walletUsdcBalance, setWalletUsdcBalance] = useState<number>(0);
  const [isPeraModalOpen, setIsPeraModalOpen] = useState<boolean>(false);

  // Core reactive engine state
  const [providers, setProviders] = useState<Provider[]>(INITIAL_PROVIDERS);
  const [decisions, setDecisions] = useState<RouteDecision[]>(INITIAL_DECISIONS);
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [events, setEvents] = useState<SystemEvent[]>(INITIAL_EVENTS);

  // Simulation animation states
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeSimStep, setActiveSimStep] = useState<number>(0);
  const [simTargetName, setSimTargetName] = useState<string>('Beta FastSummarize');
  const [simCapability, setSimCapability] = useState<string>('text.summarize');

  // Modals
  const [isAgentModalOpen, setIsAgentModalOpen] = useState<boolean>(false);
  const [isCompositeModalOpen, setIsCompositeModalOpen] = useState<boolean>(false);

  // Quick Agent Modal form state
  const [quickCapability, setQuickCapability] = useState<CapabilityType>('text.summarize');
  const [quickPriority, setQuickPriority] = useState<PriorityProfile>('balanced');
  const [quickMaxPrice, setQuickMaxPrice] = useState<number>(5000);

  // Fetch live ALGO & USDC balances from Algorand node for connected address
  const refreshWalletBalance = async (addr: string) => {
    try {
      const domain =
        network === 'mainnet'
          ? 'mainnet-api.algonode.cloud'
          : 'testnet-api.algonode.cloud';
      const res = await fetch(`https://${domain}/v2/accounts/${addr}`);
      if (res.ok) {
        const data = await res.json();
        const microAlgo = data.amount || 0;
        setWalletAlgoBalance(microAlgo / 1000000);

        // Algorand USDC ASA IDs:
        // MainNet = 31566704
        // TestNet = 10458941
        const targetUsdcAssetId = network === 'mainnet' ? 31566704 : 10458941;
        const usdcObj = data.assets?.find(
          (a: any) =>
            a['asset-id'] === targetUsdcAssetId ||
            a['asset-id'] === 31566704 ||
            a['asset-id'] === 10458941
        );
        setWalletUsdcBalance(usdcObj ? (usdcObj.amount || 0) / 1000000 : 0);
        return;
      }
    } catch (e) {
      console.warn('[Route402] Balance lookup error for address:', addr);
    }
  };

  const handleConnectPeraWallet = (address: string, accountName?: string) => {
    setConnectedWallet(address);
    if (accountName) {
      setWalletAccountName(accountName);
    }
    refreshWalletBalance(address);
  };

  const handleDisconnectPeraWallet = async () => {
    try {
      const peraWallet = getPeraWallet();
      await peraWallet.disconnect();
    } catch (e) {
      // Disconnected
    }
    setConnectedWallet(null);
    setWalletAlgoBalance(0);
    setWalletUsdcBalance(0);
  };

  // Reconnect existing Pera Wallet session on mount / network change
  useEffect(() => {
    try {
      const peraWallet = getPeraWallet();
      peraWallet
        .reconnectSession()
        .then((accounts) => {
          if (accounts && accounts.length > 0) {
            setConnectedWallet(accounts[0]);
            refreshWalletBalance(accounts[0]);
          }
        })
        .catch(() => {});
    } catch (e) {
      // Pera SDK offline fallback
    }
  }, [network]);

  // Refetch balance when connected address or network updates (with 5s auto-polling)
  useEffect(() => {
    if (!connectedWallet) return;

    refreshWalletBalance(connectedWallet);
    const interval = setInterval(() => {
      refreshWalletBalance(connectedWallet);
    }, 5000);

    return () => clearInterval(interval);
  }, [connectedWallet, network]);

  // 1. Initial REST API Fetch from Backend Server
  useEffect(() => {
    async function fetchServerState() {
      try {
        const [provRes, decRes, payRes] = await Promise.all([
          fetch(`${API_BASE}/providers`),
          fetch(`${API_BASE}/decisions`),
          fetch(`${API_BASE}/payments`),
        ]);

        if (provRes.ok) {
          const provData = await provRes.json();
          if (provData.providers) setProviders(provData.providers);
        }
        if (decRes.ok) {
          const decData = await decRes.json();
          if (decData.decisions) setDecisions(decData.decisions);
        }
        if (payRes.ok) {
          const payData = await payRes.json();
          if (payData.payments) setPayments(payData.payments);
        }
      } catch (err) {
        console.log('[Route402 Client] Local backend server offline, using in-memory state.');
      }
    }
    fetchServerState();
  }, []);

  // 2. WebSocket Event Synchronization
  useEffect(() => {
    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket('ws://localhost:4000/v1/events');

      socket.onmessage = (event) => {
        try {
          const sysEvent: SystemEvent = JSON.parse(event.data);
          setEvents((prev) => [sysEvent, ...prev.slice(0, 49)]);

          if (sysEvent.type === 'DECISION_MADE') {
            setDecisions((prev) => [sysEvent.data, ...prev]);
          } else if (sysEvent.type === 'PAYMENT_SETTLED' || sysEvent.type === 'PAYMENT_REFUSED') {
            setPayments((prev) => [sysEvent.data, ...prev]);
          } else if (sysEvent.type === 'PROVIDER_STATE_CHANGED') {
            setProviders((prev) =>
              prev.map((p) => (p.id === sysEvent.data.id ? sysEvent.data : p))
            );
          }
        } catch (e) {
          console.error('[WebSocket Parsing Error]', e);
        }
      };
    } catch (err) {
      console.log('[Route402 Client] WebSocket connection skipped.');
    }

    return () => {
      if (socket) socket.close();
    };
  }, []);

  // Computed Savings Stats
  const stats = useMemo(
    () => computeSavings(decisions, payments, providers),
    [decisions, payments, providers]
  );

  const circuitOpenCount = useMemo(
    () => providers.filter((p) => p.circuitState === 'open').length,
    [providers]
  );

  // Chaos controls
  const handleSetChaos = async (providerId: string, mode: ChaosMode) => {
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id !== providerId) return p;
        return {
          ...p,
          chaosMode: mode,
          circuitState: mode === 'offline' || mode === 'corrupt' ? 'open' : 'closed',
        };
      })
    );

    try {
      await fetch(`${API_BASE}/providers/${providerId}/chaos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
    } catch (e) {
      // client-side state already updated
    }
  };

  const handleResetCircuit = async (providerId: string) => {
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id !== providerId) return p;
        return {
          ...p,
          circuitState: 'closed',
          consecutiveFailures: 0,
          circuitOpenedAt: null,
          chaosMode: 'healthy',
        };
      })
    );

    try {
      await fetch(`${API_BASE}/providers/${providerId}/chaos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'healthy' }),
      });
    } catch (e) {
      // client state updated
    }
  };

  const handleResetAllChaos = async () => {
    setProviders((prev) =>
      prev.map((p) => ({
        ...p,
        chaosMode: 'healthy',
        circuitState: 'closed',
        consecutiveFailures: 0,
        circuitOpenedAt: null,
      }))
    );

    try {
      await fetch(`${API_BASE}/providers/reset-all`, { method: 'POST' });
    } catch (e) {
      // client state updated
    }
  };

  const handleAddProvider = async (newProv: Partial<Provider>) => {
    const id = `prov_${Date.now()}`;
    const fullProvider: Provider = {
      id,
      name: newProv.name || 'New Provider',
      endpoint: newProv.endpoint || 'https://api.newprov.ai/x402',
      capabilities: newProv.capabilities || ['text.summarize'],
      advertisedPriceMicroUSDC: newProv.advertisedPriceMicroUSDC || 10000,
      walletAddress: `NEW402PROVIDER${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
      registeredAt: Date.now(),
      latencyP50Ms: 350,
      latencyP95Ms: 700,
      successCount: 0,
      failureCount: 0,
      circuitState: 'closed',
      circuitOpenedAt: null,
      consecutiveFailures: 0,
      chaosMode: 'healthy',
      totalEarnedMicroUSDC: 0,
      latencyHistory: [{ timestamp: Date.now(), latencyMs: 350 }],
    };

    setProviders((prev) => [fullProvider, ...prev]);

    try {
      await fetch(`${API_BASE}/providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullProvider),
      });
    } catch (e) {
      // client state updated
    }
  };

  // Run a single agent request through the live routing engine
  const executeAgentRequest = async (
    capability: CapabilityType,
    priority: PriorityProfile = 'balanced',
    maxPrice: number = 25000
  ) => {
    if (isSimulating) return;

    setIsSimulating(true);
    setSimCapability(capability);

    // Step 1: Agent Request initialized
    setActiveSimStep(1);
    await new Promise((r) => setTimeout(r, 200));

    // Step 2: Route402 Router candidate gathering
    setActiveSimStep(2);
    await new Promise((r) => setTimeout(r, 200));

    // Step 3: Decision Engine Scorer
    setActiveSimStep(3);

    const candidates = evaluateAndScoreCandidates(providers, {
      capability,
      payload: {},
      constraints: { priority, maxPriceMicroUSDC: maxPrice },
    });

    let eligibleCandidates = candidates.filter((c) => c.eligible).sort((a, b) => a.compositeScore - b.compositeScore);

    if (eligibleCandidates.length === 0) {
      // Automatic Rerouting Fallback: Pick cheapest healthy candidate
      const healthyCandidates = candidates.filter(
        (c) => !c.ineligibleReason?.includes('Circuit Open') && !c.ineligibleReason?.includes('Offline')
      );
      if (healthyCandidates.length > 0) {
        const cheapestFallback = [...healthyCandidates].sort((a, b) => a.priceMicroUSDC - b.priceMicroUSDC)[0];
        eligibleCandidates = [{ ...cheapestFallback, eligible: true }];
      } else {
        setIsSimulating(false);
        setActiveSimStep(0);
        alert(`All registered providers for ${capability} are currently offline or open circuit.`);
        return;
      }
    }

    const winnerCandidate = eligibleCandidates[0];
    const winnerProvObj = providers.find((p) => p.id === winnerCandidate.providerId) || providers[0];
    setSimTargetName(winnerCandidate.providerName);

    // Step 4: Dispatch to Selected Provider
    setActiveSimStep(4);
    await new Promise((r) => setTimeout(r, 250));

    // Step 5: Algorand x402 Settlement
    setActiveSimStep(5);

    let peraTxData: any = null;

    // IF PERA WALLET CONNECTED -> Trigger transaction signing request in Pera Wallet!
    if (connectedWallet) {
      const peraRes = await sendPeraPaymentTransaction(
        connectedWallet,
        winnerProvObj.walletAddress || 'ZUNPAEMLOF6H3YE6Q6GJBG2BOWUNID7ZQJ5FX6SE2KEZSR5VAFSMTSPERE',
        winnerCandidate.priceMicroUSDC,
        network
      );

      if (!peraRes.success) {
        setIsSimulating(false);
        setActiveSimStep(0);
        alert(`[Pera Wallet] ${peraRes.error || 'Transaction request was cancelled by user.'}`);
        return;
      }
      peraTxData = peraRes;
      refreshWalletBalance(connectedWallet);
    }

    try {
      // Execute live on backend server
      const res = await fetch(`${API_BASE}/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capability,
          payload: { prompt: 'Summarize agent routing architecture' },
          constraints: { priority, maxPriceMicroUSDC: maxPrice },
          senderAddress: connectedWallet || undefined,
          agentId: connectedWallet || undefined,
        }),
      });

      const serverData = await res.json();

      if (res.ok && serverData.payment && peraTxData) {
        serverData.payment.txIds = peraTxData.txIds;
        serverData.payment.explorerUrl = peraTxData.explorerUrl;
      }

      if (!res.ok && !peraTxData) {
        setIsSimulating(false);
        setActiveSimStep(0);
        alert(serverData.message || 'Routing request failed.');
        return;
      }

      // Step 6: Verified Response
      setActiveSimStep(6);
      await new Promise((r) => setTimeout(r, 150));

      // Refresh providers & stats from server
      const provRes = await fetch(`${API_BASE}/providers`);
      if (provRes.ok) {
        const provData = await provRes.json();
        setProviders(provData.providers);
      }
    } catch (err) {
      // Client-side fallback if server offline
      setActiveSimStep(6);

      const decId = `dec_${Date.now().toString(36)}`;
      const txHash = peraTxData?.txId || generateTxHash();
      const reason = generateDecisionExplanation(winnerCandidate, candidates, {
        capability,
        payload: {},
        constraints: { priority, maxPriceMicroUSDC: maxPrice },
      });

      const decRecord: RouteDecision = {
        id: decId,
        requestId: `req_${Date.now().toString(36)}`,
        capability,
        timestamp: Date.now(),
        candidates,
        selectedProviderId: winnerCandidate.providerId,
        selectedProviderName: winnerCandidate.providerName,
        reason,
        fallbackChain: [winnerCandidate.providerId],
      };

      const payRecord: PaymentRecord = {
        id: `pay_${Date.now().toString(36)}`,
        decisionId: decId,
        providerId: winnerCandidate.providerId,
        providerName: winnerCandidate.providerName,
        amountMicroUSDC: winnerCandidate.priceMicroUSDC,
        network,
        txIds: peraTxData?.txIds || [txHash],
        groupId: `GROUP_ALG_PERA_${Math.floor(Math.random() * 899999 + 100000)}`,
        feeSponsored: true,
        settledAt: Date.now(),
        finalityMs: 2400,
        status: 'settled',
        explorerUrl: peraTxData?.explorerUrl || `https://lora.algokit.io/testnet/transaction/${txHash}`,
      };

      setDecisions((prev) => [decRecord, ...prev]);
      setPayments((prev) => [payRecord, ...prev]);
    }

    setIsSimulating(false);
    setActiveSimStep(0);
  };

  // Run traffic burst (10x load)
  const handleTriggerBurst = async (count: number = 10) => {
    const caps: CapabilityType[] = [
      'text.summarize',
      'code.review',
      'image.generate',
      'audio.transcribe',
    ];
    for (let i = 0; i < count; i++) {
      const randomCap = caps[Math.floor(Math.random() * caps.length)];
      await executeAgentRequest(randomCap, 'balanced', 35000);
      await new Promise((r) => setTimeout(r, 100));
    }
  };

  // Execute Composite Algorand Atomic Group Request
  const handleExecuteComposite = async (p1Id: string, p2Id: string) => {
    const prov1 = providers.find((p) => p.id === p1Id) || providers[0];
    const prov2 = providers.find((p) => p.id === p2Id) || providers[1];

    setIsSimulating(true);
    setSimTargetName(`${prov1.name} + ${prov2.name}`);
    setActiveSimStep(1);

    await new Promise((r) => setTimeout(r, 300));
    setActiveSimStep(5); // Algorand Grouping Step

    let peraCompData: any = null;

    // IF PERA WALLET CONNECTED -> Trigger Atomic Group transaction signature in Pera Wallet!
    if (connectedWallet) {
      const peraRes = await sendPeraCompositeTransaction(
        connectedWallet,
        prov1.walletAddress || 'ZUNPAEMLOF6H3YE6Q6GJBG2BOWUNID7ZQJ5FX6SE2KEZSR5VAFSMTSPERE',
        prov1.advertisedPriceMicroUSDC,
        prov2.walletAddress || 'ZUNPAEMLOF6H3YE6Q6GJBG2BOWUNID7ZQJ5FX6SE2KEZSR5VAFSMTSPERE',
        prov2.advertisedPriceMicroUSDC,
        network
      );

      if (!peraRes.success) {
        setIsSimulating(false);
        setActiveSimStep(0);
        alert(`[Pera Wallet Composite] ${peraRes.error || 'Atomic group transaction cancelled in Pera Wallet.'}`);
        return;
      }
      peraCompData = peraRes;
      refreshWalletBalance(connectedWallet);
    }

    try {
      const res = await fetch(`${API_BASE}/composite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prov1Id: p1Id,
          prov2Id: p2Id,
          senderAddress: connectedWallet || undefined,
          prov1Wallet: prov1.walletAddress,
          prov2Wallet: prov2.walletAddress,
        }),
      });
      const data = await res.json();
      if (data.compositeGroup) {
        if (peraCompData) {
          data.compositeGroup.txIds = peraCompData.txIds;
          data.compositeGroup.groupId = peraCompData.groupId || data.compositeGroup.groupId;
          data.compositeGroup.explorerUrl = peraCompData.explorerUrl;
        }
        setPayments((prev) => [data.compositeGroup, ...prev]);
      }
    } catch (e) {
      // client-side fallback
      const tx1 = peraCompData?.txIds?.[0] || generateTxHash();
      const tx2 = peraCompData?.txIds?.[1] || generateTxHash();
      const groupId = peraCompData?.groupId || `ATOMIC_GRP_${Math.floor(Math.random() * 899999 + 100000)}_PERA`;

      const decId = `dec_comp_${Date.now().toString(36)}`;
      const decRecord: RouteDecision = {
        id: decId,
        requestId: `req_comp_${Date.now()}`,
        capability: 'text.summarize',
        timestamp: Date.now(),
        candidates: [],
        selectedProviderId: prov1.id,
        selectedProviderName: `${prov1.name} & ${prov2.name}`,
        reason: `Composite Atomic Group Executed: Bundled ${prov1.name} and ${prov2.name} into Group ID ${groupId}.`,
        fallbackChain: [prov1.id, prov2.id],
      };

      const totalCost = prov1.advertisedPriceMicroUSDC + prov2.advertisedPriceMicroUSDC;

      const paymentRecord: PaymentRecord = {
        id: `pay_comp_${Date.now().toString(36)}`,
        decisionId: decId,
        providerId: prov1.id,
        providerName: `Atomic Group: ${prov1.name} + ${prov2.name}`,
        amountMicroUSDC: totalCost,
        network,
        txIds: [tx1, tx2],
        groupId,
        feeSponsored: true,
        settledAt: Date.now(),
        finalityMs: 2650,
        status: 'settled',
        explorerUrl: peraCompData?.explorerUrl || `https://lora.algokit.io/testnet/transaction/${tx1}`,
      };

      setDecisions((prev) => [decRecord, ...prev]);
      setPayments((prev) => [paymentRecord, ...prev]);
    }

    setActiveSimStep(6);
    await new Promise((r) => setTimeout(r, 200));
    setIsSimulating(false);
    setActiveSimStep(0);
  };

  // Filtered lists for search
  const filteredDecisions = decisions.filter(
    (d) =>
      d.selectedProviderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.capability.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPayments = payments.filter(
    (p) =>
      p.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.txIds.some((tx) => tx.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openCompositeModal={() => setIsCompositeModalOpen(true)}
        circuitOpenCount={circuitOpenCount}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Navbar */}
        <Navbar
          network={network}
          setNetwork={setNetwork}
          openAgentModal={() => setIsAgentModalOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          connectedWallet={connectedWallet}
          walletAccountName={walletAccountName}
          setWalletAccountName={setWalletAccountName}
          walletAlgoBalance={walletAlgoBalance}
          walletUsdcBalance={walletUsdcBalance}
          openPeraModal={() => setIsPeraModalOpen(true)}
          onDisconnectWallet={handleDisconnectPeraWallet}
        />

        {/* Content View Routing */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              providers={providers}
              decisions={filteredDecisions}
              payments={filteredPayments}
              onSetChaos={handleSetChaos}
              onResetCircuit={handleResetCircuit}
              onOpenAnalytics={() => setActiveTab('analytics')}
              isSimulating={isSimulating}
              activeSimStep={activeSimStep}
              simTargetName={simTargetName}
              simCapability={simCapability}
            />
          )}

          {activeTab === 'providers' && (
            <ProvidersView
              providers={providers}
              onSetChaos={handleSetChaos}
              onResetCircuit={handleResetCircuit}
              onAddProvider={handleAddProvider}
            />
          )}

          {activeTab === 'router' && (
            <RouterView
              providers={providers}
              onTriggerRequest={executeAgentRequest}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView payments={filteredPayments} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView stats={stats} providers={providers} />
          )}

          {activeTab === 'chaos' && (
            <ChaosSimulator
              providers={providers}
              onTriggerRequest={executeAgentRequest}
              onTriggerBurst={handleTriggerBurst}
              onSetChaos={handleSetChaos}
              onResetAllChaos={handleResetAllChaos}
              isSimulating={isSimulating}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView network={network} setNetwork={setNetwork} />
          )}
        </main>
      </div>

      {/* Quick Agent Request Runner Modal */}
      {isAgentModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#09090b] rounded-2xl max-w-md w-full border border-zinc-800 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#FF0A16]" />
                <h3 className="text-base font-bold text-white font-display">
                  Run Autonomous Agent Request
                </h3>
              </div>
              <button
                onClick={() => setIsAgentModalOpen(false)}
                className="text-zinc-400 hover:text-white font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs font-inter">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Requested Capability</label>
                <select
                  value={quickCapability}
                  onChange={(e) => setQuickCapability(e.target.value as CapabilityType)}
                  className="w-full bg-[#050505] border border-zinc-800 rounded-lg p-2.5 font-mono-num text-zinc-100"
                >
                  <option value="text.summarize">text.summarize</option>
                  <option value="code.review">code.review</option>
                  <option value="image.generate">image.generate</option>
                  <option value="audio.transcribe">audio.transcribe</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Optimization Priority</label>
                <div className="grid grid-cols-3 gap-2 font-mono-num">
                  {(['cost', 'speed', 'balanced'] as PriorityProfile[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setQuickPriority(p)}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                        quickPriority === p
                          ? 'bg-[#FF0A16] text-white border-[#FF0A16]'
                          : 'bg-[#050505] text-zinc-400 border-zinc-800 hover:bg-[#121215]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-zinc-400 font-medium mb-1.5">
                  <span>Max Price Ceiling</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="1000000"
                      step="100"
                      value={quickMaxPrice}
                      onChange={(e) => setQuickMaxPrice(Math.max(0, Number(e.target.value)))}
                      className="w-28 bg-[#050505] border border-zinc-800 focus:border-[#FF0A16] focus:outline-none rounded-lg px-2.5 py-1 font-mono-num text-right font-bold text-[#FF5C5C] text-xs transition-colors"
                      placeholder="1000"
                    />
                    <span className="text-xs font-mono-num text-zinc-400">µUSDC</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30000"
                  step="500"
                  value={quickMaxPrice}
                  onChange={(e) => setQuickMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#FF0A16] cursor-pointer"
                />
                <div className="text-[10px] text-zinc-500 font-mono-num text-right mt-1">
                  ≈ ${(quickMaxPrice / 1000000).toFixed(6)} USDC
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAgentModalOpen(false)}
                  className="px-4 py-2 border border-zinc-800 hover:bg-[#121215] rounded-xl text-zinc-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => {
                    executeAgentRequest(quickCapability, quickPriority, quickMaxPrice);
                    setIsAgentModalOpen(false);
                  }}
                  className="px-5 py-2 bg-[#FF0A16] hover:bg-[#E60000] text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,10,22,0.3)] cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> Dispatch Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Algorand Atomic Group Composite Task Modal */}
      <CompositeTaskModal
        isOpen={isCompositeModalOpen}
        onClose={() => setIsCompositeModalOpen(false)}
        providers={providers}
        onExecuteComposite={handleExecuteComposite}
        isSimulating={isSimulating}
      />

      {/* Pera Wallet Connection Modal */}
      <PeraWalletModal
        isOpen={isPeraModalOpen}
        onClose={() => setIsPeraModalOpen(false)}
        onConnect={handleConnectPeraWallet}
        network={network}
        currentAccountName={walletAccountName}
      />
    </div>
  );
}
