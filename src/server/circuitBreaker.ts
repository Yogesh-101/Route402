import { Provider, ChaosMode } from '../types';

export const CIRCUIT_FAILURE_THRESHOLD = 3;
export const CIRCUIT_COOLDOWN_MS = 30000; // 30s before half_open probe

export class CircuitBreakerManager {
  private providers: Map<string, Provider>;

  constructor(initialProviders: Provider[]) {
    this.providers = new Map();
    initialProviders.forEach((p) => this.providers.set(p.id, { ...p }));
  }

  public getProviders(): Provider[] {
    // Check for auto cooldown transitions to half_open
    const now = Date.now();
    this.providers.forEach((p) => {
      if (
        p.circuitState === 'open' &&
        p.circuitOpenedAt &&
        now - p.circuitOpenedAt > CIRCUIT_COOLDOWN_MS
      ) {
        p.circuitState = 'half_open';
      }
    });
    return Array.from(this.providers.values());
  }

  public getProvider(id: string): Provider | undefined {
    const p = this.providers.get(id);
    if (
      p &&
      p.circuitState === 'open' &&
      p.circuitOpenedAt &&
      Date.now() - p.circuitOpenedAt > CIRCUIT_COOLDOWN_MS
    ) {
      p.circuitState = 'half_open';
    }
    return p;
  }

  public recordSuccess(id: string, responseTimeMs: number): void {
    const p = this.providers.get(id);
    if (!p) return;

    p.successCount += 1;
    p.consecutiveFailures = 0;
    p.circuitState = 'closed';
    p.circuitOpenedAt = null;

    // Rolling latency update
    p.latencyP50Ms = Math.round(p.latencyP50Ms * 0.8 + responseTimeMs * 0.2);
    p.latencyP95Ms = Math.round(p.latencyP95Ms * 0.8 + responseTimeMs * 0.25);
  }

  public recordFailure(id: string, reason: string): boolean {
    const p = this.providers.get(id);
    if (!p) return false;

    p.failureCount += 1;
    p.consecutiveFailures += 1;

    let stateChanged = false;
    if (p.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD && p.circuitState !== 'open') {
      p.circuitState = 'open';
      p.circuitOpenedAt = Date.now();
      stateChanged = true;
    }

    return stateChanged;
  }

  public resetCircuit(id: string): void {
    const p = this.providers.get(id);
    if (!p) return;

    p.circuitState = 'closed';
    p.circuitOpenedAt = null;
    p.consecutiveFailures = 0;
    p.chaosMode = 'healthy';
  }

  public resetAllCircuits(): void {
    this.providers.forEach((p) => {
      p.circuitState = 'closed';
      p.circuitOpenedAt = null;
      p.consecutiveFailures = 0;
      p.chaosMode = 'healthy';
    });
  }

  public setChaosMode(id: string, mode: ChaosMode): void {
    const p = this.providers.get(id);
    if (!p) return;

    p.chaosMode = mode;
    if (mode === 'offline' || mode === 'corrupt') {
      p.circuitState = 'open';
      p.circuitOpenedAt = Date.now();
      p.consecutiveFailures = CIRCUIT_FAILURE_THRESHOLD;
    } else if (mode === 'healthy') {
      p.circuitState = 'closed';
      p.circuitOpenedAt = null;
      p.consecutiveFailures = 0;
    }
  }

  public addProvider(newProv: Partial<Provider>): Provider {
    const id = newProv.id || `prov_${Date.now().toString(36)}`;
    const fullProv: Provider = {
      id,
      name: newProv.name || 'Custom x402 Provider',
      endpoint: newProv.endpoint || 'https://api.custom.ai/v1/x402',
      capabilities: newProv.capabilities || ['text.summarize'],
      advertisedPriceMicroUSDC: newProv.advertisedPriceMicroUSDC || 12000,
      walletAddress: newProv.walletAddress || 'CUSTOMPROVIDERWALLETHASH1234567890123456789012',
      registeredAt: Date.now(),
      latencyP50Ms: 250,
      latencyP95Ms: 500,
      successCount: 1,
      failureCount: 0,
      circuitState: 'closed',
      circuitOpenedAt: null,
      consecutiveFailures: 0,
      chaosMode: 'healthy',
      totalEarnedMicroUSDC: 0,
      latencyHistory: [{ timestamp: Date.now(), latencyMs: 250 }],
    };

    this.providers.set(id, fullProv);
    return fullProv;
  }
}
