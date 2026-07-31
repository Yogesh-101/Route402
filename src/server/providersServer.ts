import express from 'express';
import { TESTNET_USDC_ASA_ID } from './algorand';

export interface ProviderServerConfig {
  id: string;
  name: string;
  port: number;
  walletAddress: string;
  priceMicroUSDC: number;
  capability: string;
}

export const MOCK_PROVIDERS_CONFIG: ProviderServerConfig[] = [
  {
    id: 'prov_alpha',
    name: 'Alpha Summarize',
    port: 4001,
    walletAddress: 'ALPHA402WALLETHASH12345678901234567890123456789',
    priceMicroUSDC: 8000,
    capability: 'text.summarize',
  },
  {
    id: 'prov_beta',
    name: 'Beta FastSummarize',
    port: 4002,
    walletAddress: 'BETA402WALLETHASH123456789012345678901234567890',
    priceMicroUSDC: 12000,
    capability: 'text.summarize',
  },
  {
    id: 'prov_gamma',
    name: 'Gamma Enterprise AI',
    port: 4003,
    walletAddress: 'GAMMA402WALLETHASH1234567890123456789012345678',
    priceMicroUSDC: 25000,
    capability: 'text.summarize',
  },
];

/**
 * Creates Express app for an x402 resource server returning authentic HTTP 402 responses.
 */
export function createProviderExpressApp(config: ProviderServerConfig): express.Express {
  const app = express();
  app.use(express.json());

  // Capability Endpoint requiring x402 payment
  app.post('/v1/capability', (req, res) => {
    const paymentHeader = req.headers['x-402-payment'] || req.headers['authorization'];

    // If no payment header attached, return HTTP 402 Payment Required
    if (!paymentHeader) {
      res.status(402).set({
        'x402-version': '1.0',
        'x402-accepts': 'ASA_TRANSFER',
        'x402-pay-to': config.walletAddress,
        'x402-max-amount-required': config.priceMicroUSDC.toString(),
        'x402-asset-id': TESTNET_USDC_ASA_ID.toString(),
        'x402-network': 'testnet',
      }).json({
        error: 'Payment Required',
        message: `Resource requires payment of ${config.priceMicroUSDC} µUSDC to ${config.walletAddress}`,
        x402Requirements: {
          version: '1.0',
          accepts: 'ASA_TRANSFER',
          payTo: config.walletAddress,
          maxAmountRequiredMicroUSDC: config.priceMicroUSDC,
          assetId: TESTNET_USDC_ASA_ID,
          network: 'testnet',
        },
      });
      return;
    }

    // Payment provided -> serve LLM inference result
    res.status(200).json({
      status: 'success',
      providerId: config.id,
      providerName: config.name,
      capability: config.capability,
      output: {
        summary: `[${config.name} Output]: Route402 is an x402-native routing and settlement layer that enables autonomous AI agents to pay and route across micro-services using Algorand ASA USDC with 0 ALGO fee sponsorship.`,
        tokensUsed: 142,
        processingTimeMs: Math.floor(Math.random() * 150) + 80,
      },
    });
  });

  return app;
}
