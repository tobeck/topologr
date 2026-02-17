import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDB } from "@/lib/api/test-helpers";
import { services, connections } from "@/lib/db/schema";
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
  return new Request(`http://localhost:3000${url}`) as any;
}

function seedGraph() {
  const now = new Date();
  testDb.insert(services).values([
    { id: "svc-aa", name: "A", tier: "medium", type: "service", createdAt: now, updatedAt: now },
    { id: "svc-bb", name: "B", tier: "medium", type: "service", createdAt: now, updatedAt: now },
    { id: "svc-cc", name: "C", tier: "medium", type: "service", createdAt: now, updatedAt: now },
  ]).run();

  // A → B → C  (B depends on A, C depends on B)
  // If A goes down, B and C are affected
  testDb.insert(connections).values([
    {
      id: "conn-1",
      sourceId: "svc-bb",
      targetId: "svc-aa",
      criticality: "high",
      isAsync: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "conn-2",
      sourceId: "svc-cc",
      targetId: "svc-bb",
      criticality: "medium",
      isAsync: false,
      createdAt: now,
      updatedAt: now,
    },
  ]).run();
}

describe("GET /api/impact/:serviceId", () => {
  beforeEach(() => {
    testDb = createTestDB();
  });

  it("returns 404 for missing service", async () => {
    const res = await GET(makeRequest("/api/impact/nope"), {
      params: Promise.resolve({ serviceId: "nope" }),
    });

    expect(res.status).toBe(404);
  });

  it("returns empty impact for leaf node", async () => {
    const now = new Date();
    testDb.insert(services).values({
      id: "leaf-svc",
      name: "Leaf",
      tier: "low",
      type: "service",
      createdAt: now,
      updatedAt: now,
    }).run();

    const res = await GET(makeRequest("/api/impact/leaf-svc"), {
      params: Promise.resolve({ serviceId: "leaf-svc" }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sourceId).toBe("leaf-svc");
    expect(data.directDependents).toEqual([]);
    expect(data.allAffected).toEqual([]);
  });

  it("computes correct impact for graph", async () => {
    seedGraph();

    const res = await GET(makeRequest("/api/impact/svc-aa"), {
      params: Promise.resolve({ serviceId: "svc-aa" }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sourceId).toBe("svc-aa");
    expect(data.directDependents).toContain("svc-bb");
    expect(data.allAffected).toContain("svc-bb");
    expect(data.allAffected).toContain("svc-cc");
    expect(data.maxCriticality).toBe("high");
  });
});
