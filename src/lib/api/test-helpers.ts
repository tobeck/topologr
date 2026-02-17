import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";

/**
 * Create an in-memory SQLite database for testing.
 * Returns a Drizzle instance with the full schema applied.
 */
export function createTestDB() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  sqlite.exec(`
    CREATE TABLE services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      owner TEXT,
      tier TEXT NOT NULL DEFAULT 'medium',
      type TEXT NOT NULL DEFAULT 'service',
      repository TEXT,
      documentation TEXT,
      tags TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE connections (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      target_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      label TEXT,
      protocol TEXT DEFAULT 'https',
      port INTEGER,
      description TEXT,
      criticality TEXT NOT NULL DEFAULT 'medium',
      sla_target_ms REAL,
      sla_uptime_percent REAL,
      auth_method TEXT,
      is_async INTEGER NOT NULL DEFAULT 0,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE imports (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      imported_at INTEGER NOT NULL,
      services_count INTEGER NOT NULL DEFAULT 0,
      connections_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'success',
      errors TEXT
    );
  `);

  return drizzle(sqlite, { schema });
}

/**
 * Build a NextRequest-like object for testing route handlers.
 */
export function buildRequest(
  url: string,
  options?: {
    method?: string;
    body?: unknown;
  }
): Request {
  const init: RequestInit = {
    method: options?.method ?? "GET",
  };

  if (options?.body) {
    init.body = JSON.stringify(options.body);
    init.headers = { "Content-Type": "application/json" };
  }

  return new Request(`http://localhost:3000${url}`, init);
}
