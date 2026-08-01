import {
  Provider,
  RouteRequest,
  RouteDecision,
  ScoredCandidate,
  PriorityProfile,
  PaymentRecord,
  CallRecord,
  SavingsSnapshot,
  CapabilityType,
} from '../types';

export function evaluateAndScoreCandidates(
  providers: Provider[],
  request: RouteRequest
): ScoredCandidate[] {
  const capabilityProviders = providers.filter((p) =>
    p.capabilities.includes(request.capability)
  );

  const maxPriceCeiling = request.constraints?.maxPriceMicroUSDC;
  const excludeList = request.constraints?.excludeProviders || [];

  // Determine min and max among capability providers for normalization
  const validPrices = capabilityProviders.map((p) => p.advertisedPriceMicroUSDC);
  const minPrice = validPrices.length ? Math.min(...validPrices) : 1;
  const maxPrice = validPrices.length ? Math.max(...validPrices) : 1;

  const validLatencies = capabilityProviders.map((p) => p.latencyP95Ms);
  const minLatency = validLatencies.length ? Math.min(...validLatencies) : 1;
  const maxLatency = validLatencies.length ? Math.max(...validLatencies) : 1;

  const priority: PriorityProfile = request.constraints?.priority || 'balanced';

  const weights = {
    cost: { Wp: 0.65, Wl: 0.10, Wr: 0.25 },
    speed: { Wp: 0.10, Wl: 0.65, Wr: 0.25 },
    balanced: { Wp: 0.35, Wl: 0.35, Wr: 0.30 },
  }[priority];

  return capabilityProviders.map((provider) => {
    let eligible = true;
    let ineligibleReason: string | undefined;

    if (provider.circuitState === 'open') {
      eligible = false;
      ineligibleReason = 'Circuit Open (3+ consecutive failures)';
    } else if (provider.chaosMode === 'offline') {
      eligible = false;
      ineligibleReason = 'Provider Offline / Unreachable';
    } else if (maxPriceCeiling && maxPriceCeiling > 0 && provider.advertisedPriceMicroUSDC > maxPriceCeiling) {
      eligible = false;
      ineligibleReason = `Exceeds max price ceiling (${provider.advertisedPriceMicroUSDC.toLocaleString()} µUSDC > ${maxPriceCeiling.toLocaleString()} µUSDC)`;
    } else if (excludeList.includes(provider.id)) {
      eligible = false;
      ineligibleReason = 'Explicitly excluded by request constraints';
    }

    // Normalization
    const normPrice =
      maxPrice === minPrice
        ? 0
        : (provider.advertisedPriceMicroUSDC - minPrice) / (maxPrice - minPrice);

    const normLatency =
      maxLatency === minLatency
        ? 0
        : (provider.latencyP95Ms - minLatency) / (maxLatency - minLatency);

    const totalCalls = provider.successCount + provider.failureCount;
    const reliability =
      totalCalls === 0 ? 1 : provider.successCount / totalCalls;
    const unreliability = 1 - reliability;

    const penalty = Math.min(provider.consecutiveFailures * 0.15, 0.45);

    const compositeScore =
      weights.Wp * normPrice +
      weights.Wl * normLatency +
      weights.Wr * unreliability +
      penalty;

    return {
      providerId: provider.id,
      providerName: provider.name,
      priceMicroUSDC: provider.advertisedPriceMicroUSDC,
      expectedLatencyMs: provider.latencyP50Ms,
      reliabilityScore: Number(reliability.toFixed(3)),
      compositeScore: Number(compositeScore.toFixed(3)),
      eligible,
      ineligibleReason,
    };
  });
}

export function generateDecisionExplanation(
  selected: ScoredCandidate,
  candidates: ScoredCandidate[],
  request: RouteRequest
): string {
  const ineligible = candidates.filter((c) => !c.eligible);
  const eligibleOthers = candidates.filter(
    (c) => c.eligible && c.providerId !== selected.providerId
  );

  if (ineligible.some((i) => i.ineligibleReason?.includes('Circuit Open'))) {
    const openOne = ineligible.find((i) => i.ineligibleReason?.includes('Circuit Open'));
    return `${selected.providerName} selected: ${openOne?.providerName} excluded due to open circuit breaker.`;
  }

  if (eligibleOthers.length === 0) {
    return `${selected.providerName} selected: Sole eligible candidate for capability ${request.capability}.`;
  }

  const cheapest = [...candidates]
    .filter((c) => c.eligible)
    .sort((a, b) => a.priceMicroUSDC - b.priceMicroUSDC)[0];

  const fastest = [...candidates]
    .filter((c) => c.eligible)
    .sort((a, b) => a.expectedLatencyMs - b.expectedLatencyMs)[0];

  if (selected.providerId === cheapest.providerId && eligibleOthers.length > 0) {
    const nextPrice = eligibleOthers[0].priceMicroUSDC;
    const discount = Math.round(
      ((nextPrice - selected.priceMicroUSDC) / nextPrice) * 100
    );
    return `${selected.providerName} selected: ${discount > 0 ? `${discount}% cheaper than ${eligibleOthers[0].providerName}` : 'Optimal price point'} with p95 latency ${selected.expectedLatencyMs}ms.`;
  }

  if (selected.providerId === fastest.providerId) {
    return `${selected.providerName} selected: priority=${request.constraints?.priority || 'balanced'}, delivering lowest expected latency (${selected.expectedLatencyMs}ms).`;
  }

  return `${selected.providerName} selected: Optimal composite score (${selected.compositeScore}) balancing cost, latency, and reliability.`;
}

export function generateTxHash(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function computeSavings(
  decisions: RouteDecision[],
  payments: PaymentRecord[],
  providers: Provider[]
): SavingsSnapshot {
  const totalRequests = decisions.length;
  const settledPayments = payments.filter((p) => p.status === 'settled');
  const totalSpentMicroUSDC = settledPayments.reduce(
    (acc, p) => acc + p.amountMicroUSDC,
    0
  );

  // Naive baseline: assuming every request went to the most expensive provider available for that capability
  let naiveBaselineMicroUSDC = 0;
  decisions.forEach((dec) => {
    const capabilityProviders = providers.filter((p) =>
      p.capabilities.includes(dec.capability)
    );
    const maxPrice = capabilityProviders.length
      ? Math.max(...capabilityProviders.map((p) => p.advertisedPriceMicroUSDC))
      : 24000;
    naiveBaselineMicroUSDC += maxPrice;
  });

  const savedMicroUSDC = Math.max(0, naiveBaselineMicroUSDC - totalSpentMicroUSDC);
  const savedPercent =
    naiveBaselineMicroUSDC > 0
      ? Math.round((savedMicroUSDC / naiveBaselineMicroUSDC) * 1000) / 10
      : 0;

  const requestsRerouted = decisions.filter(
    (d) => d.fallbackChain && d.fallbackChain.length > 1
  ).length;

  const paymentsRefused = payments.filter((p) => p.status === 'refused').length;

  const finalityTimes = settledPayments
    .map((p) => p.finalityMs)
    .filter((f): f is number => f !== null);

  const avgSettlementTimeMs = finalityTimes.length
    ? Math.round(
        finalityTimes.reduce((a, b) => a + b, 0) / finalityTimes.length
      )
    : 2400;

  return {
    totalRequests,
    totalSpentMicroUSDC,
    naiveBaselineMicroUSDC,
    savedMicroUSDC,
    savedPercent,
    requestsRerouted,
    paymentsRefused,
    avgSettlementTimeMs,
  };
}
