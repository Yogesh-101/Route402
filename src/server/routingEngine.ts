import {
  Provider,
  RouteRequest,
  RouteDecision,
  ScoredCandidate,
  PriorityProfile,
} from '../types';

export function evaluateAndScoreCandidates(
  providers: Provider[],
  request: RouteRequest
): ScoredCandidate[] {
  const capability = request.capability;
  const priority = request.constraints?.priority || 'balanced';
  const maxPrice = request.constraints?.maxPriceMicroUSDC;
  const excludeProviders = request.constraints?.excludeProviders || [];

  // Filter matching capability
  const matchingProviders = providers.filter((p) =>
    p.capabilities.includes(capability)
  );

  if (matchingProviders.length === 0) return [];

  // Determine min and max for normalization
  const prices = matchingProviders.map((p) => p.advertisedPriceMicroUSDC);
  const latencies = matchingProviders.map((p) => p.latencyP95Ms);

  const minPrice = Math.min(...prices);
  const maxPriceVal = Math.max(...prices);
  const minLatency = Math.min(...latencies);
  const maxLatencyVal = Math.max(...latencies);

  // Priority weights (PRD Section 9.3)
  let Wp = 0.35;
  let Wl = 0.35;
  let Wr = 0.30;

  if (priority === 'cost') {
    Wp = 0.65;
    Wl = 0.10;
    Wr = 0.25;
  } else if (priority === 'speed') {
    Wp = 0.10;
    Wl = 0.65;
    Wr = 0.25;
  }

  return matchingProviders.map((p) => {
    let eligible = true;
    let ineligibleReason: string | undefined = undefined;

    // Eligibility Filter (PRD Section 9.5)
    if (p.circuitState === 'open') {
      eligible = false;
      ineligibleReason = 'circuit open (failure threshold reached)';
    } else if (maxPrice && maxPrice > 0 && p.advertisedPriceMicroUSDC > maxPrice) {
      eligible = false;
      ineligibleReason = `exceeds max price (${p.advertisedPriceMicroUSDC} > ${maxPrice})`;
    } else if (excludeProviders.includes(p.id)) {
      eligible = false;
      ineligibleReason = 'excluded by request constraint';
    }

    // Normalizations (PRD Section 9.2)
    const normPrice =
      maxPriceVal === minPrice
        ? 0
        : (p.advertisedPriceMicroUSDC - minPrice) / (maxPriceVal - minPrice);

    const normLatency =
      maxLatencyVal === minLatency
        ? 0
        : (p.latencyP95Ms - minLatency) / (maxLatencyVal - minLatency);

    const totalCalls = p.successCount + p.failureCount;
    const reliabilityScore = totalCalls > 0 ? p.successCount / totalCalls : 1.0;
    const unreliability = 1.0 - reliabilityScore;

    // Recent failure penalty
    const recentFailurePenalty = Math.min(p.consecutiveFailures * 0.15, 0.45);

    // Composite Score calculation (lower is better)
    const compositeScore =
      Wp * normPrice +
      Wl * normLatency +
      Wr * unreliability +
      recentFailurePenalty;

    return {
      providerId: p.id,
      providerName: p.name,
      priceMicroUSDC: p.advertisedPriceMicroUSDC,
      expectedLatencyMs: p.latencyP95Ms,
      reliabilityScore: Number(reliabilityScore.toFixed(3)),
      compositeScore: Number(compositeScore.toFixed(3)),
      eligible,
      ineligibleReason,
    };
  });
}

export function generateDecisionExplanation(
  winner: ScoredCandidate,
  allCandidates: ScoredCandidate[],
  request: RouteRequest
): string {
  const priority = request.constraints?.priority || 'balanced';
  const rejected = allCandidates.filter((c) => c.providerId !== winner.providerId);

  const circuitOpenCount = rejected.filter(
    (c) => c.ineligibleReason?.includes('circuit open')
  ).length;

  if (circuitOpenCount > 0) {
    const circuitOpenName = rejected.find((c) =>
      c.ineligibleReason?.includes('circuit open')
    )?.providerName;
    return `${winner.providerName} selected: ${circuitOpenName || 'Alternative provider'} excluded due to active circuit breaker protection.`;
  }

  if (priority === 'cost') {
    const other = rejected.find((c) => c.eligible);
    if (other && winner.priceMicroUSDC < other.priceMicroUSDC) {
      const pct = Math.round(
        ((other.priceMicroUSDC - winner.priceMicroUSDC) / other.priceMicroUSDC) * 100
      );
      return `${winner.providerName} selected: ${pct}% cheaper than ${other.providerName} with optimal cost profile.`;
    }
  }

  if (priority === 'speed') {
    const other = rejected.find((c) => c.eligible);
    if (other && winner.expectedLatencyMs < other.expectedLatencyMs) {
      const ratio = (other.expectedLatencyMs / winner.expectedLatencyMs).toFixed(1);
      return `${winner.providerName} selected: priority=speed, and p95 latency is ${ratio}x faster than ${other.providerName}.`;
    }
  }

  return `${winner.providerName} selected: lowest composite score (${winner.compositeScore}) balancing cost, latency, and reliability.`;
}
