import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDB } from "@/lib/api/test-helpers";
import { services, connections } from "@/lib/db/schema";
import { randomUUID } from "node:crypto";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "@/lib/db/schema";

let testDb: BetterSQLite3Database<typeof schema>;

vi.mock("@/lib/db", () => ({
  get db() {
    return testDb;
  },
}));

const { GET } = await import("./route");

function makeRequest(url: string) {
  return new Request(
    `http://localhost:3000${url}`,
  ) as unknown as import("next/server").NextRequest;
}

function seedData() {
  const now = new Date();
  testDb
    .insert(services)
    .values({
      id: "auth-svc",
      name: "Auth Service",
      owner: "platform",
      tier: "critical",
      type: "service",
      tags: JSON.stringify(["auth"]),
      createdAt: now,
      updatedAt: now,
    })
    .run();

  testDb
    .insert(services)
    .values({
      id: "user-db",
      name: "User DB",
      tier: "critical",
      type: "database",
      createdAt: now,
      updatedAt: now,
    })
    .run();

  testDb
    .insert(connections)
    .values({
      id: randomUUID(),
      sourceId: "auth-svc",
      targetId: "user-db",
      protocol: "postgres",
      port: 5432,
      criticality: "critical",
      isAsync: false,
      createdAt: now,
      updatedAt: now,
    })
    .run();
}

describe("GET /api/export", () => {
  beforeEach(() => {
    testDb = createTestDB();
  });

  it("returns YAML with correct content type", async () => {
    seedData();
    const res = await GET(makeRequest("/api/export"));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/yaml; charset=utf-8");
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="topologr-export.yaml"',
    );

    const body = await res.text();
    expect(body).toContain("auth-svc");
    expect(body).toContain("user-db");
  });

  it("returns JSON when format=json", async () => {
    seedData();
    const res = await GET(makeRequest("/api/export?format=json"));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");

    const data = await res.json();
    expect(data.services).toHaveLength(2);
    expect(data.connections).toHaveLength(1);
  });

  it("returns valid response for empty DB", async () => {
    const res = await GET(makeRequest("/api/export"));

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("services");
  });

  it("returns empty JSON for empty DB", async () => {
    const res = await GET(makeRequest("/api/export?format=json"));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.services).toEqual([]);
    expect(data.connections).toEqual([]);
  });
});
