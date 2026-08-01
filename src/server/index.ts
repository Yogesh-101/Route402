import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { INITIAL_PROVIDERS, INITIAL_DECISIONS, INITIAL_PAYMENTS } from '../data/initialData';
import { Provider, RouteRequest, RouteDecision, PaymentRecord, SavingsSnapshot, SystemEvent } from '../types';
import { CircuitBreakerManager } from './circuitBreaker';
import { Route402Database } from './db';
import { evaluateAndScoreCandidates, generateDecisionExplanation } from './routingEngine';
import {
  createAlgorandPaymentGroup,
  createAlgorandCompositeGroup,
  DEFAULT_AGENT_ADDRESS,
  DEFAULT_PROVIDER_ADDRESS,
} from './algorand';
import { MOCK_PROVIDERS_CONFIG, createProviderExpressApp } from './providersServer';

const PORT = 4000;
const app = express();
app.use(express.json());

// Enable CORS for Vite frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-402-payment');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Central Server State Managers with SQLite Database Persistence
const circuitManager = new CircuitBreakerManager(INITIAL_PROVIDERS);
Route402Database.seedIfEmpty(INITIAL_PROVIDERS, INITIAL_DECISIONS, INITIAL_PAYMENTS);

let decisions: RouteDecision[] = Route402Database.getAllDecisions();
if (decisions.length === 0) decisions = [...INITIAL_DECISIONS];

let payments: PaymentRecord[] = Route402Database.getAllPayments();
if (payments.length === 0) payments = [...INITIAL_PAYMENTS];

// Calculate Savings Snapshot
function calculateSavings(): SavingsSnapshot {
  const totalRequests = decisions.length;
  const settledPayments = payments.filter((p) => p.status === 'settled');
  const totalSpentMicroUSDC = settledPayments.reduce((acc, p) => acc + p.amountMicroUSDC, 0);

  const naiveBaselineMicroUSDC = Math.round(
    decisions.reduce((acc, d) => {
      const highestPrice = Math.max(...d.candidates.map((c) => c.priceMicroUSDC), 25000);
      return acc + highestPrice;
    }, 0)
  );

  const savedMicroUSDC = Math.max(0, naiveBaselineMicroUSDC - totalSpentMicroUSDC);
  const savedPercent =
    naiveBaselineMicroUSDC > 0
      ? Number(((savedMicroUSDC / naiveBaselineMicroUSDC) * 100).toFixed(1))
      : 0;

  const requestsRerouted = decisions.filter((d) => d.fallbackChain.length > 1).length;
  const paymentsRefused = payments.filter((p) => p.status === 'refused').length;

  return {
    totalRequests,
    totalSpentMicroUSDC,
    naiveBaselineMicroUSDC,
    savedMicroUSDC,
    savedPercent,
    requestsRerouted,
    paymentsRefused,
    avgSettlementTimeMs: 2400,
  };
}

// Setup HTTP Server & WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/v1/events' });

function broadcastEvent(event: SystemEvent) {
  const payload = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Express Provider Microservices (Ports 4001, 4002, 4003)
MOCK_PROVIDERS_CONFIG.forEach((config) => {
  const provApp = createProviderExpressApp(config);
  const provServer = provApp.listen(config.port, () => {
    console.log(`[x402 Provider Microservice] ${config.name} listening on port ${config.port}`);
  });
  provServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[x402 Provider Microservice] Port ${config.port} already active (${config.name}).`);
    } else {
      console.error(`[x402 Provider Microservice Error]`, err);
    }
  });
});

// REST API ENDPOINTS

// 1. GET /v1/providers — Central Provider Pool & Shared Circuit State
app.get('/v1/providers', (req, res) => {
  res.json({ providers: circuitManager.getProviders() });
});

// 2. GET /v1/decisions — Central Decision History Log
app.get('/v1/decisions', (req, res) => {
  res.json({ decisions });
});

// 3. GET /v1/payments — Settlement Ledger
app.get('/v1/payments', (req, res) => {
  res.json({ payments });
});

// 4. GET /v1/stats — Economic Savings Snapshot
app.get('/v1/stats', (req, res) => {
  res.json(calculateSavings());
});

// 5. POST /v1/providers — Register New Provider
app.post('/v1/providers', (req, res) => {
  const newProv = circuitManager.addProvider(req.body);
  broadcastEvent({
    type: 'PROVIDER_STATE_CHANGED',
    data: newProv,
    timestamp: Date.now(),
  });
  res.status(201).json(newProv);
});

// 6. POST /v1/route — Single Agent Route Request Execution (Scoring + Handshake + Algorand Group Settlement)
app.post('/v1/route', async (req, res) => {
  const request: RouteRequest = req.body;
  const startTime = Date.now();

  const currentProviders = circuitManager.getProviders();
  const candidates = evaluateAndScoreCandidates(currentProviders, request);
  const eligibleCandidates = candidates.filter((c) => c.eligible).sort((a, b) => a.compositeScore - b.compositeScore);

  if (eligibleCandidates.length === 0) {
    res.status(503).json({
      error: 'no_provider_available',
      message: 'All registered providers are ineligible or circuit open.',
      candidates,
    });
    return;
  }

  // Attempt routing through sorted candidates (Fallback Chain Execution)
  const fallbackChain: string[] = [];
  let selectedWinner = eligibleCandidates[0];
  let executionSuccess = false;
  let providerResponsePayload: any = null;
  let callLatencyMs = 0;

  for (const candidate of eligibleCandidates) {
    fallbackChain.push(candidate.providerId);
    const provider = circuitManager.getProvider(candidate.providerId);
    if (!provider) continue;

    // Check Chaos State Simulation
    if (provider.chaosMode === 'offline') {
      circuitManager.recordFailure(provider.id, 'Connection refused / offline');
      broadcastEvent({
        type: 'CIRCUIT_TRIPPED',
        data: { providerId: provider.id, providerName: provider.name, mode: 'offline' },
        timestamp: Date.now(),
      });
      continue; // Try next fallback candidate
    }

    if (provider.chaosMode === 'slow') {
      await new Promise((r) => setTimeout(r, 1200)); // Artificial latency delay
    }

    if (provider.chaosMode === 'corrupt') {
      // Guard catches corrupt response -> Refuses payment!
      circuitManager.recordFailure(provider.id, 'Corrupt response payload');
      
      const decisionId = `dec_${Date.now().toString(36)}`;
      const paymentRecord: PaymentRecord = {
        id: `pay_${Date.now().toString(36)}`,
        decisionId,
        providerId: provider.id,
        providerName: provider.name,
        amountMicroUSDC: provider.advertisedPriceMicroUSDC,
        network: 'testnet',
        txIds: [],
        groupId: null,
        feeSponsored: true,
        settledAt: null,
        finalityMs: null,
        status: 'refused',
        explorerUrl: null,
      };
      payments.unshift(paymentRecord);
      Route402Database.savePayment(paymentRecord);

      broadcastEvent({
        type: 'PAYMENT_REFUSED',
        data: paymentRecord,
        timestamp: Date.now(),
      });
      continue; // Reroute to next candidate!
    }

    // Success path
    callLatencyMs = Math.floor(Math.random() * 120) + 140;
    circuitManager.recordSuccess(provider.id, callLatencyMs);
    selectedWinner = candidate;
    executionSuccess = true;
    providerResponsePayload = {
      summary: `[${provider.name} Output]: Route402 evaluated candidate pool and settled x402 payment on Algorand in ${callLatencyMs}ms.`,
    };
    break;
  }

  if (!executionSuccess) {
    res.status(503).json({
      error: 'routing_failed',
      message: 'All candidate providers failed delivery.',
      fallbackChain,
    });
    return;
  }

  // Construct Real Algorand Atomic Group Transaction with Fee Abstraction
  const winningProvObj = circuitManager.getProvider(selectedWinner.providerId)!;

  const customReceiver = req.body?.receiverAddress || req.body?.providerAddress;
  const targetWallet = (customReceiver && customReceiver.length >= 50)
    ? customReceiver
    : (winningProvObj.walletAddress && winningProvObj.walletAddress.length >= 50
        ? winningProvObj.walletAddress
        : DEFAULT_PROVIDER_ADDRESS);

  const customSender = req.body?.senderAddress || req.body?.agentAddress || request.agentId;
  const senderAddress = (customSender && customSender.length >= 50)
    ? customSender
    : DEFAULT_AGENT_ADDRESS;

  const algorandResult = await createAlgorandPaymentGroup(
    senderAddress,
    targetWallet,
    winningProvObj.advertisedPriceMicroUSDC
  );

  const decisionId = `dec_${Date.now().toString(36)}`;
  const explanation = generateDecisionExplanation(selectedWinner, candidates, request);

  const routeDecision: RouteDecision = {
    id: decisionId,
    requestId: `req_${Date.now().toString(36)}`,
    capability: request.capability,
    timestamp: Date.now(),
    candidates,
    selectedProviderId: selectedWinner.providerId,
    selectedProviderName: selectedWinner.providerName,
    reason: explanation,
    fallbackChain,
  };
  decisions.unshift(routeDecision);
  Route402Database.saveDecision(routeDecision);

  const paymentRecord: PaymentRecord = {
    id: `pay_${Date.now().toString(36)}`,
    decisionId,
    providerId: winningProvObj.id,
    providerName: winningProvObj.name,
    amountMicroUSDC: winningProvObj.advertisedPriceMicroUSDC,
    network: 'testnet',
    txIds: algorandResult.txIds,
    groupId: algorandResult.groupId,
    feeSponsored: algorandResult.feeSponsored,
    settledAt: Date.now(),
    finalityMs: algorandResult.finalityMs,
    status: 'settled',
    explorerUrl: algorandResult.explorerUrl,
  };
  payments.unshift(paymentRecord);
  Route402Database.savePayment(paymentRecord);
  circuitManager.recordEarnings(winningProvObj.id, winningProvObj.advertisedPriceMicroUSDC);

  // Broadcast WebSocket Events
  broadcastEvent({
    type: 'DECISION_MADE',
    data: routeDecision,
    timestamp: Date.now(),
  });

  broadcastEvent({
    type: 'PAYMENT_SETTLED',
    data: paymentRecord,
    timestamp: Date.now(),
  });

  res.json({
    requestId: routeDecision.requestId,
    result: providerResponsePayload,
    routing: {
      selectedProvider: selectedWinner.providerId,
      selectedProviderName: selectedWinner.providerName,
      reason: explanation,
      candidatesEvaluated: candidates.length,
      fallbackChain,
      decisionId,
    },
    payment: {
      amountMicroUSDC: winningProvObj.advertisedPriceMicroUSDC,
      network: 'testnet',
      txIds: algorandResult.txIds,
      groupId: algorandResult.groupId,
      feeSponsored: algorandResult.feeSponsored,
      finalityMs: algorandResult.finalityMs,
      explorerUrl: algorandResult.explorerUrl,
    },
    timing: {
      decisionMs: 3,
      providerMs: callLatencyMs,
      settlementMs: algorandResult.finalityMs,
      totalMs: 3 + callLatencyMs + algorandResult.finalityMs,
    },
  });
});

// 7. POST /v1/composite — Execute Algorand Atomic Group Composite Task
app.post('/v1/composite', async (req, res) => {
  const { prov1Id, prov2Id, senderAddress, prov1Wallet, prov2Wallet } = req.body;
  const p1 = circuitManager.getProvider(prov1Id || 'prov_beta') || circuitManager.getProviders()[0];
  const p2 = circuitManager.getProvider(prov2Id || 'prov_delta') || circuitManager.getProviders()[1];

  const customSender = senderAddress || req.body?.agentAddress || req.body?.agentId;
  const fromAddr = (customSender && customSender.length >= 50) ? customSender : DEFAULT_AGENT_ADDRESS;

  const receiver1 = prov1Wallet || p1.walletAddress || DEFAULT_PROVIDER_ADDRESS;
  const receiver2 = prov2Wallet || p2.walletAddress || DEFAULT_PROVIDER_ADDRESS;

  const compositeResult = await createAlgorandCompositeGroup(
    fromAddr,
    receiver1,
    p1.advertisedPriceMicroUSDC,
    receiver2,
    p2.advertisedPriceMicroUSDC
  );

  const decisionId = `dec_comp_${Date.now().toString(36)}`;
  const totalCost = p1.advertisedPriceMicroUSDC + p2.advertisedPriceMicroUSDC;

  const paymentRecord: PaymentRecord = {
    id: `pay_comp_${Date.now().toString(36)}`,
    decisionId,
    providerId: `${p1.id}+${p2.id}`,
    providerName: `${p1.name} + ${p2.name}`,
    amountMicroUSDC: totalCost,
    network: 'testnet',
    txIds: compositeResult.txIds,
    groupId: compositeResult.groupId,
    feeSponsored: true,
    settledAt: Date.now(),
    finalityMs: compositeResult.finalityMs,
    status: 'settled',
    explorerUrl: compositeResult.explorerUrl,
  };
  payments.unshift(paymentRecord);
  Route402Database.savePayment(paymentRecord);

  broadcastEvent({
    type: 'PAYMENT_SETTLED',
    data: paymentRecord,
    timestamp: Date.now(),
  });

  res.json({
    status: 'success',
    compositeGroup: paymentRecord,
  });
});

// 8. POST /v1/providers/:id/chaos — Chaos Matrix Toggle
app.post('/v1/providers/:id/chaos', (req, res) => {
  const { mode } = req.body;
  const { id } = req.params;

  circuitManager.setChaosMode(id, mode);
  const updatedProv = circuitManager.getProvider(id);

  broadcastEvent({
    type: 'PROVIDER_STATE_CHANGED',
    data: updatedProv,
    timestamp: Date.now(),
  });

  res.json({ status: 'updated', provider: updatedProv });
});

// 9. POST /v1/providers/reset-all — Restore All Chaos Modes
app.post('/v1/providers/reset-all', (req, res) => {
  circuitManager.resetAllCircuits();
  res.json({ status: 'all_reset', providers: circuitManager.getProviders() });
});

// Start Server
server.listen(PORT, () => {
  console.log(`[Route402 Core Router Backend] Running on http://localhost:${PORT}`);
  console.log(`[WebSocket Stream] Events broadcasting at ws://localhost:${PORT}/v1/events`);
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[Route402 Core Router Backend] Port ${PORT} already active.`);
  } else {
    console.error(`[Route402 Server Error]`, err);
  }
});
