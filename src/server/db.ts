import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';
import { Provider, RouteDecision, PaymentRecord } from '../types';

dotenv.config();

const dbPath = process.env.DATABASE_PATH || 'route402.db';
const db = new Database(dbPath);

// Enable WAL (Write-Ahead Logging) mode for fast concurrent operations
db.pragma('journal_mode = WAL');

// 1. Initialize Tables (PRD Section 8)
db.exec(`
  CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    capabilities TEXT NOT NULL,
    advertisedPriceMicroUSDC INTEGER NOT NULL,
    walletAddress TEXT NOT NULL,
    registeredAt INTEGER NOT NULL,
    latencyP50Ms INTEGER NOT NULL,
    latencyP95Ms INTEGER NOT NULL,
    successCount INTEGER NOT NULL,
    failureCount INTEGER NOT NULL,
    circuitState TEXT NOT NULL,
    circuitOpenedAt INTEGER,
    consecutiveFailures INTEGER NOT NULL,
    chaosMode TEXT NOT NULL,
    totalEarnedMicroUSDC INTEGER NOT NULL,
    latencyHistory TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY,
    requestId TEXT NOT NULL,
    capability TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    candidates TEXT NOT NULL,
    selectedProviderId TEXT NOT NULL,
    selectedProviderName TEXT NOT NULL,
    reason TEXT NOT NULL,
    fallbackChain TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    decisionId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    providerName TEXT NOT NULL,
    amountMicroUSDC INTEGER NOT NULL,
    network TEXT NOT NULL,
    txIds TEXT NOT NULL,
    groupId TEXT,
    feeSponsored INTEGER NOT NULL,
    settledAt INTEGER,
    finalityMs INTEGER,
    status TEXT NOT NULL,
    refusedReason TEXT,
    explorerUrl TEXT
  );
`);

export class Route402Database {
  // Provider DAO
  public static getAllProviders(): Provider[] {
    const rows = db.prepare('SELECT * FROM providers ORDER BY registeredAt ASC').all() as any[];
    return rows.map((r) => ({
      ...r,
      capabilities: JSON.parse(r.capabilities),
      latencyHistory: JSON.parse(r.latencyHistory),
      circuitOpenedAt: r.circuitOpenedAt || null,
    }));
  }

  public static saveProvider(p: Provider): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO providers (
        id, name, endpoint, capabilities, advertisedPriceMicroUSDC,
        walletAddress, registeredAt, latencyP50Ms, latencyP95Ms,
        successCount, failureCount, circuitState, circuitOpenedAt,
        consecutiveFailures, chaosMode, totalEarnedMicroUSDC, latencyHistory
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      p.id,
      p.name,
      p.endpoint,
      JSON.stringify(p.capabilities),
      p.advertisedPriceMicroUSDC,
      p.walletAddress,
      p.registeredAt,
      p.latencyP50Ms,
      p.latencyP95Ms,
      p.successCount,
      p.failureCount,
      p.circuitState,
      p.circuitOpenedAt,
      p.consecutiveFailures,
      p.chaosMode,
      p.totalEarnedMicroUSDC,
      JSON.stringify(p.latencyHistory)
    );
  }

  // Decision DAO
  public static getAllDecisions(limit: number = 50): RouteDecision[] {
    const rows = db.prepare('SELECT * FROM decisions ORDER BY timestamp DESC LIMIT ?').all(limit) as any[];
    return rows.map((r) => ({
      ...r,
      candidates: JSON.parse(r.candidates),
      fallbackChain: JSON.parse(r.fallbackChain),
    }));
  }

  public static saveDecision(d: RouteDecision): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO decisions (
        id, requestId, capability, timestamp, candidates,
        selectedProviderId, selectedProviderName, reason, fallbackChain
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      d.id,
      d.requestId,
      d.capability,
      d.timestamp,
      JSON.stringify(d.candidates),
      d.selectedProviderId,
      d.selectedProviderName,
      d.reason,
      JSON.stringify(d.fallbackChain)
    );
  }

  // Payment DAO
  public static getAllPayments(limit: number = 100): PaymentRecord[] {
    const rows = db.prepare('SELECT * FROM payments ORDER BY settledAt DESC, id DESC LIMIT ?').all(limit) as any[];
    return rows.map((r) => ({
      ...r,
      txIds: JSON.parse(r.txIds),
      feeSponsored: Boolean(r.feeSponsored),
      groupId: r.groupId || null,
      settledAt: r.settledAt || null,
      finalityMs: r.finalityMs || null,
      refusedReason: r.refusedReason || undefined,
      explorerUrl: r.explorerUrl || null,
    }));
  }

  public static savePayment(p: PaymentRecord): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO payments (
        id, decisionId, providerId, providerName, amountMicroUSDC,
        network, txIds, groupId, feeSponsored, settledAt,
        finalityMs, status, refusedReason, explorerUrl
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      p.id,
      p.decisionId,
      p.providerId,
      p.providerName,
      p.amountMicroUSDC,
      p.network,
      JSON.stringify(p.txIds),
      p.groupId,
      p.feeSponsored ? 1 : 0,
      p.settledAt,
      p.finalityMs,
      p.status,
      p.refusedReason || null,
      p.explorerUrl
    );
  }

  // Seed Initial State if Database is Empty
  public static seedIfEmpty(initialProviders: Provider[], initialDecisions: RouteDecision[], initialPayments: PaymentRecord[]): void {
    const countRow = db.prepare('SELECT COUNT(*) as count FROM providers').get() as { count: number };
    if (countRow.count === 0) {
      console.log('[SQLite DB] Seeding initial provider registry and transaction ledger...');
      initialProviders.forEach((p) => this.saveProvider(p));
      initialDecisions.forEach((d) => this.saveDecision(d));
      initialPayments.forEach((p) => this.savePayment(p));
    } else {
      // Sync reduced provider prices into SQLite DB
      try {
        db.prepare('UPDATE providers SET advertisedPriceMicroUSDC = 100 WHERE id = "prov_alpha"').run();
        db.prepare('UPDATE providers SET advertisedPriceMicroUSDC = 250 WHERE id = "prov_beta"').run();
        db.prepare('UPDATE providers SET advertisedPriceMicroUSDC = 800 WHERE id = "prov_gamma"').run();
        db.prepare('UPDATE providers SET advertisedPriceMicroUSDC = 400 WHERE id = "prov_delta"').run();
        db.prepare('UPDATE providers SET advertisedPriceMicroUSDC = 1200 WHERE id = "prov_epsilon"').run();
      } catch (e) {
        // Table update fallback
      }
    }
  }
}
