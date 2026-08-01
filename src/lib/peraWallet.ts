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
 * Creates and prompts Pera Wallet to sign an x402 payment transaction (Single Provider)
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

    // Check account assets to see if USDC ASA is opted in
    let isUsdcOptedIn = false;
    const targetAssetId = network === 'mainnet' ? 31566704 : 10458941;

    try {
      const accountInfo = await algodClient.accountInformation(connectedAddress).do();
      isUsdcOptedIn = accountInfo.assets?.some(
        (a: any) => a['asset-id'] === targetAssetId
      ) || false;
    } catch (e) {
      // Account info fetch silent fallback
    }

    let txn: algosdk.Transaction;

    if (isUsdcOptedIn) {
      // Create USDC ASA Transfer Transaction
      txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: connectedAddress,
        receiver: receiverAddress,
        amount: amountMicroUSDC,
        assetIndex: targetAssetId,
        suggestedParams,
      });
    } else {
      // Fallback to ALGO Payment Transaction
      txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: connectedAddress,
        receiver: receiverAddress,
        amount: Math.max(1000, amountMicroUSDC), // microAlgos
        suggestedParams,
        note: new Uint8Array(Buffer.from(`Route402:x402Payment:${Date.now()}`)),
      });
    }

    // Format transaction for Pera Wallet Connect SDK
    const txnsToSign = [
      {
        txn,
        signers: [connectedAddress],
      },
    ];

    // Trigger Pera Wallet signature prompt modal/notification
    console.log('[Pera Wallet] Requesting user transaction signature from connected wallet:', connectedAddress);
    const signedTxns = await peraWallet.signTransaction([txnsToSign]);

    if (!signedTxns || signedTxns.length === 0) {
      throw new Error('Transaction signature was cancelled by user in Pera Wallet.');
    }

    // Submit signed transaction to Algorand network
    console.log('[Pera Wallet] Submitting signed transaction to Algorand network...');
    const sendResult = await algodClient.sendRawTransaction(signedTxns[0]).do();
    const txId = (sendResult as any)?.txId || (sendResult as any)?.txid || txn.txID();

    const explorerUrl = `https://lora.algokit.io/${network}/transaction/${txId}`;

    return {
      success: true,
      txId,
      txIds: [txId],
      explorerUrl,
    };
  } catch (err: any) {
    console.error('[Pera Wallet Transaction Error]', err);
    const errorMsg =
      err?.message || err?.data?.message || 'Transaction signing failed or was cancelled in Pera Wallet.';
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Creates and prompts Pera Wallet to sign a Composite Atomic Group Transaction (2 Providers)
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

    // Check USDC opt-in
    let isUsdcOptedIn = false;
    const targetAssetId = network === 'mainnet' ? 31566704 : 10458941;

    try {
      const accountInfo = await algodClient.accountInformation(connectedAddress).do();
      isUsdcOptedIn = accountInfo.assets?.some(
        (a: any) => a['asset-id'] === targetAssetId
      ) || false;
    } catch (e) {
      // Silent fallback
    }

    let txn1: algosdk.Transaction;
    let txn2: algosdk.Transaction;

    if (isUsdcOptedIn) {
      txn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: connectedAddress,
        receiver: receiver1Address,
        amount: amount1MicroUSDC,
        assetIndex: targetAssetId,
        suggestedParams,
      });

      txn2 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: connectedAddress,
        receiver: receiver2Address,
        amount: amount2MicroUSDC,
        assetIndex: targetAssetId,
        suggestedParams,
      });
    } else {
      txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: connectedAddress,
        receiver: receiver1Address,
        amount: Math.max(1000, amount1MicroUSDC),
        suggestedParams,
        note: new Uint8Array(Buffer.from(`Route402:CompositeStep1:${Date.now()}`)),
      });

      txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: connectedAddress,
        receiver: receiver2Address,
        amount: Math.max(1000, amount2MicroUSDC),
        suggestedParams,
        note: new Uint8Array(Buffer.from(`Route402:CompositeStep2:${Date.now()}`)),
      });
    }

    // Bind into Algorand Atomic Group
    const groupTxns = [txn1, txn2];
    algosdk.assignGroupID(groupTxns);

    const txnsToSign = [
      { txn: txn1, signers: [connectedAddress] },
      { txn: txn2, signers: [connectedAddress] },
    ];

    console.log('[Pera Wallet] Requesting Atomic Group signature from Pera Wallet...');
    const signedTxns = await peraWallet.signTransaction([txnsToSign]);

    if (!signedTxns || signedTxns.length < 2) {
      throw new Error('Atomic Group signing was cancelled by user in Pera Wallet.');
    }

    // Submit signed atomic transaction group
    console.log('[Pera Wallet] Submitting signed atomic group to Algorand network...');
    const sendResult = await algodClient.sendRawTransaction(signedTxns).do();
    const tx1Id = txn1.txID();
    const tx2Id = txn2.txID();
    const groupId = Buffer.from(txn1.group!).toString('base64');

    const explorerUrl = `https://lora.algokit.io/${network}/transaction/${tx1Id}`;

    return {
      success: true,
      txId: tx1Id,
      txIds: [tx1Id, tx2Id],
      groupId,
      explorerUrl,
    };
  } catch (err: any) {
    console.error('[Pera Wallet Composite Transaction Error]', err);
    const errorMsg =
      err?.message || err?.data?.message || 'Atomic group transaction cancelled in Pera Wallet.';
    return {
      success: false,
      error: errorMsg,
    };
  }
}
