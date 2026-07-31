export type CapabilityType = 'text.summarize' | 'code.review' | 'image.generate' | 'audio.transcribe' | 'data.enrichment';

export type PriorityProfile = 'cost' | 'speed' | 'balanced';

export type CircuitState = 'closed' | 'open' | 'half_open';

export type ChaosMode = 'healthy' | 'slow' | 'corrupt' | 'offline';

export interface Provider {
  id: string;
  name: string;
  endpoint: string;
  capabilities: CapabilityType[];
  advertisedPriceMicroUSDC: number; // e.g. 12000 = $0.012 USDC
  walletAddress: string;
  registeredAt: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
  successCount: number;
  failureCount: number;
  circuitState: CircuitState;
  circuitOpenedAt: number | null;
  consecutiveFailures: number;
  chaosMode: ChaosMode;
  totalEarnedMicroUSDC: number;
  latencyHistory: { timestamp: number; latencyMs: number }[];
}

export interface RequestConstraints {
  maxPriceMicroUSDC?: number;
  maxLatencyMs?: number;
  priority?: PriorityProfile;
  excludeProviders?: string[];
}

export interface RouteRequest {
  capability: CapabilityType;
  payload: Record<string, unknown>;
  constraints?: RequestConstraints;
  agentId?: string;
  isComposite?: boolean;
  compositeCapabilities?: CapabilityType[];
}

export interface ScoredCandidate {
  providerId: string;
  providerName: string;
  priceMicroUSDC: number;
  expectedLatencyMs: number;
  reliabilityScore: number; // 0..1
  compositeScore: number; // lower is better
  eligible: boolean;
  ineligibleReason?: string;
}

export interface RouteDecision {
  id: string;
  requestId: string;
  capability: CapabilityType;
  timestamp: number;
  candidates: ScoredCandidate[];
  selectedProviderId: string;
  selectedProviderName: string;
  reason: string;
  fallbackChain: string[];
}

export type PaymentStatus = 'pending' | 'settled' | 'failed' | 'refused';

export interface PaymentRecord {
  id: string;
  decisionId: string;
  providerId: string;
  providerName: string;
  amountMicroUSDC: number;
  network: 'testnet' | 'mainnet';
  txIds: string[];
  groupId: string | null;
  feeSponsored: boolean;
  settledAt: number | null;
  finalityMs: number | null;
  status: PaymentStatus;
  refusedReason?: string;
  explorerUrl: string | null;
}

export interface CallRecord {
  id: string;
  decisionId: string;
  providerId: string;
  startedAt: number;
  completedAt: number | null;
  latencyMs: number | null;
  outcome: 'success' | 'timeout' | 'error' | 'invalid_response';
  httpStatus: number | null;
  errorDetail: string | null;
}

export interface SavingsSnapshot {
  totalRequests: number;
  totalSpentMicroUSDC: number;
  naiveBaselineMicroUSDC: number;
  savedMicroUSDC: number;
  savedPercent: number;
  requestsRerouted: number;
  paymentsRefused: number;
  avgSettlementTimeMs: number;
}

export type SystemEventType =
  | 'decision'
  | 'payment'
  | 'circuit'
  | 'chaos'
  | 'stats'
  | 'DECISION_MADE'
  | 'PAYMENT_SETTLED'
  | 'PAYMENT_REFUSED'
  | 'PROVIDER_STATE_CHANGED'
  | 'CIRCUIT_TRIPPED';

export interface SystemEvent {
  id?: string;
  timestamp: number;
  type: SystemEventType;
  title?: string;
  description?: string;
  data?: any;
  metadata?: Record<string, unknown>;
}
