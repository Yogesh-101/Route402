import algosdk from 'algosdk';
import { PeraWalletConnect } from '@perawallet/connect';

let peraWalletInstance: PeraWalletConnect | null = null;

export function getPeraWallet(): PeraWalletConnect {
  if (!peraWalletInstance) {
    peraWalletInstance = new PeraWalletConnect({
      shouldShowSignTxnToast: true,
    });
  }
  return peraWalletInstance;
}

export interface PeraTxnResult {
  success: boolean;
  txId?: string;
  txIds?: string[];
  groupId?: string;
  explorerUrl?: string;
  error?: string;
}

export async function ensurePeraSession(connectedAddress: string): Promise<PeraWalletConnect> {
  const peraWallet = getPeraWallet();
  try {
    const accounts = await peraWallet.reconnectSession();
    if (accounts && accounts.length > 0) {
      return peraWallet;
    }
  } catch (e) {
    // Session reconnect attempt fallback
  }

  // If session is still not connected (e.g., manual address or lost session), prompt Pera Connect modal
  try {
    const accounts = await peraWallet.connect();
    if (!accounts || accounts.length === 0) {
      throw new Error('Pera Wallet is not connected.');
    }
  } catch (err: any) {
    if (err?.data?.type === 'CONNECT_MODAL_CLOSED') {
      throw new Error('Pera Wallet connection modal was closed by user.');
    }
    throw err;
  }
  return peraWallet;
}

/**
 * Creates and prompts Pera Wallet to sign an x402 USDC payment transaction (Single Provider)
 * ALWAYS transfers USDC ASA (#10458941 TestNet / #31566704 MainNet).
 * If the user's account is not opted into USDC ASA, bundles an Opt-In transaction into the group.
 */
export async function sendPeraPaymentTransaction(
  connectedAddress: string,
  receiverAddress: string,
  amountMicroUSDC: number,
  network: 'testnet' | 'mainnet' = 'testnet'
): Promise<PeraTxnResult> {
  try {
    const peraWallet = await ensurePeraSession(connectedAddress);
    const serverUrl =
      network === 'mainnet'
        ? 'https://mainnet-api.algonode.cloud'
        : 'https://testnet-api.algonode.cloud';

    const algodClient = new algosdk.Algodv2('', serverUrl, 443);
    const suggestedParams = await algodClient.getTransactionParams().do();

    const targetAssetId = network === 'mainnet' ? 31566704 : 10458941;

    // Check if connected address is opted into USDC ASA
    let isUsdcOptedIn = false;
    try {
      const accountInfo: any = await algodClient.accountInformation(connectedAddress).do();
      const assets = accountInfo.assets || accountInfo['assets'] || [];
      isUsdcOptedIn = assets.some(
        (a: any) =>
          Number(a['asset-id'] || a['assetId'] || a['asset-index'] || 0) === targetAssetId
      );
    } catch (e) {
      console.warn('[Pera Wallet] Account info check failed, assuming opt-in required:', e);
    }

    const txns: algosdk.Transaction[] = [];
    const txnsToSign: { txn: algosdk.Transaction; signers: string[] }[] = [];

    // 1. If not opted into USDC ASA, bundle Opt-In Transaction (0 USDC to self)
    if (!isUsdcOptedIn) {
      console.log('[Pera Wallet] Account not opted into USDC ASA', targetAssetId, '- Adding Opt-In transaction');
      const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: connectedAddress,
        receiver: connectedAddress,
        amount: 0,
        assetIndex: targetAssetId,
        suggestedParams: { ...suggestedParams },
        note: new Uint8Array(Buffer.from(`Route402:OptInUSDC:${Date.now()}`)),
      });
      txns.push(optInTxn);
      txnsToSign.push({ txn: optInTxn, signers: [connectedAddress] });
    }

    // 2. USDC ASA Transfer Transaction (Agent -> Provider)
    const usdcTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: connectedAddress,
      receiver: receiverAddress,
      amount: amountMicroUSDC,
      assetIndex: targetAssetId,
      suggestedParams: { ...suggestedParams },
      note: new Uint8Array(Buffer.from(`Route402:x402USDCPayment:${Date.now()}`)),
    });
    txns.push(usdcTxn);
    txnsToSign.push({ txn: usdcTxn, signers: [connectedAddress] });

    if (txns.length > 1) {
      algosdk.assignGroupID(txns);
    }

    console.log('[Pera Wallet] Requesting user transaction signature from connected wallet:', connectedAddress);
    const signedTxns = await peraWallet.signTransaction([txnsToSign]);

    if (!signedTxns || signedTxns.length === 0) {
      throw new Error('Transaction signature was cancelled by user in Pera Wallet.');
    }

    console.log('[Pera Wallet] Submitting signed USDC transaction to Algorand network...');
    const sendResult = await algodClient.sendRawTransaction(signedTxns).do();
    const mainTxId = usdcTxn.txID();
    const txId = (sendResult as any)?.txId || (sendResult as any)?.txid || mainTxId;

    const explorerUrl = `https://lora.algokit.io/${network}/transaction/${txId}`;

    return {
      success: true,
      txId,
      txIds: txns.map((t) => t.txID()),
      explorerUrl,
    };
  } catch (err: any) {
    console.error('[Pera Wallet Transaction Error]', err);
    let errorMsg =
      err?.message || err?.data?.message || 'Transaction signing failed or was cancelled in Pera Wallet.';

    if (errorMsg.includes('underfunded') || errorMsg.includes('below min') || errorMsg.includes('balance')) {
      errorMsg = `Insufficient USDC balance in connected wallet. Agent payment requires ${(amountMicroUSDC / 1000000).toFixed(4)} USDC (ASA #${network === 'mainnet' ? 31566704 : 10458941}).`;
    }

    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Creates and prompts Pera Wallet to sign a Composite Atomic Group USDC Transaction (2 Providers)
 * ALWAYS transfers USDC ASA to both providers.
 */
export async function sendPeraCompositeTransaction(
  connectedAddress: string,
  receiver1Address: string,
  amount1MicroUSDC: number,
  receiver2Address: string,
  amount2MicroUSDC: number,
  network: 'testnet' | 'mainnet' = 'testnet'
): Promise<PeraTxnResult> {
  try {
    const peraWallet = await ensurePeraSession(connectedAddress);
    const serverUrl =
      network === 'mainnet'
        ? 'https://mainnet-api.algonode.cloud'
        : 'https://testnet-api.algonode.cloud';

    const algodClient = new algosdk.Algodv2('', serverUrl, 443);
    const suggestedParams = await algodClient.getTransactionParams().do();

    const targetAssetId = network === 'mainnet' ? 31566704 : 10458941;

    // Check USDC opt-in
    let isUsdcOptedIn = false;
    try {
      const accountInfo: any = await algodClient.accountInformation(connectedAddress).do();
      const assets = accountInfo.assets || accountInfo['assets'] || [];
      isUsdcOptedIn = assets.some(
        (a: any) =>
          Number(a['asset-id'] || a['assetId'] || a['asset-index'] || 0) === targetAssetId
      );
    } catch (e) {
      console.warn('[Pera Wallet Composite] Account info check failed:', e);
    }

    const txns: algosdk.Transaction[] = [];
    const txnsToSign: { txn: algosdk.Transaction; signers: string[] }[] = [];

    // 1. Opt-In if not opted in
    if (!isUsdcOptedIn) {
      const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: connectedAddress,
        receiver: connectedAddress,
        amount: 0,
        assetIndex: targetAssetId,
        suggestedParams: { ...suggestedParams },
        note: new Uint8Array(Buffer.from(`Route402:OptInUSDC:${Date.now()}`)),
      });
      txns.push(optInTxn);
      txnsToSign.push({ txn: optInTxn, signers: [connectedAddress] });
    }

    // 2. Step 1 Provider USDC transfer
    const txn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: connectedAddress,
      receiver: receiver1Address,
      amount: amount1MicroUSDC,
      assetIndex: targetAssetId,
      suggestedParams: { ...suggestedParams },
      note: new Uint8Array(Buffer.from(`Route402:CompositeStep1USDC:${Date.now()}`)),
    });
    txns.push(txn1);
    txnsToSign.push({ txn: txn1, signers: [connectedAddress] });

    // 3. Step 2 Provider USDC transfer
    const txn2 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: connectedAddress,
      receiver: receiver2Address,
      amount: amount2MicroUSDC,
      assetIndex: targetAssetId,
      suggestedParams: { ...suggestedParams },
      note: new Uint8Array(Buffer.from(`Route402:CompositeStep2USDC:${Date.now()}`)),
    });
    txns.push(txn2);
    txnsToSign.push({ txn: txn2, signers: [connectedAddress] });

    // Bind into Algorand Atomic Group
    algosdk.assignGroupID(txns);

    console.log('[Pera Wallet] Requesting Atomic Group signature from Pera Wallet...');
    const signedTxns = await peraWallet.signTransaction([txnsToSign]);

    if (!signedTxns || signedTxns.length < txns.length) {
      throw new Error('Atomic Group signing was cancelled by user in Pera Wallet.');
    }

    console.log('[Pera Wallet] Submitting signed atomic group to Algorand network...');
    const sendResult = await algodClient.sendRawTransaction(signedTxns).do();
    const tx1Id = txn1.txID();
    const tx2Id = txn2.txID();
    const groupId = Buffer.from(txn1.group!).toString('base64');

    const explorerUrl = `https://lora.algokit.io/${network}/transaction/${tx1Id}`;

    return {
      success: true,
      txId: tx1Id,
      txIds: txns.map((t) => t.txID()),
      groupId,
      explorerUrl,
    };
  } catch (err: any) {
    console.error('[Pera Wallet Composite Transaction Error]', err);
    let errorMsg =
      err?.message || err?.data?.message || 'Atomic group transaction cancelled in Pera Wallet.';

    if (errorMsg.includes('underfunded') || errorMsg.includes('below min') || errorMsg.includes('balance')) {
      errorMsg = `Insufficient USDC balance in connected wallet for composite task.`;
    }

    return {
      success: false,
      error: errorMsg,
    };
  }
}

