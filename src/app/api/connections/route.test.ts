import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDB } from "@/lib/api/test-helpers";
import { services } from "@/lib/db/schema";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "@/lib/db/schema";

let testDb: BetterSQLite3Database<typeof schema>;

vi.mock("@/lib/db", () => ({
  get db() {
    return testDb;
  },
}));

const { GET, POST } = await import("./route");

function makeRequest(url: string, opts?: { method?: string; body?: unknown }) {
  return new Request(`http://localhost:3000${url}`, {
    method: opts?.method ?? "GET",
    ...(opts?.body
      ? {
          body: JSON.stringify(opts.body),
          headers: { "Content-Type": "application/json" },
        }
      : {}),
  }) as any;
}

function seedServices() {
  const now = new Date();
  testDb.insert(services).values([
    { id: "svc-aa", name: "A", tier: "medium", type: "service", createdAt: now, updatedAt: now },
    { id: "svc-bb", name: "B", tier: "medium", type: "service", createdAt: now, updatedAt: now },
  ]).run();
}

describe("POST /api/connections", () => {
  beforeEach(() => {
    testDb = createTestDB();
  });

  it("creates a connection", async () => {
    seedServices();

    const res = await POST(
      makeRequest("/api/connections", {
        method: "POST",
        body: { sourceId: "svc-aa", targetId: "svc-bb", protocol: "grpc" },
      })
    );

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.sourceId).toBe("svc-aa");
    expect(data.targetId).toBe("svc-bb");
    expect(data.protocol).toBe("grpc");
  });

  it("rejects self-loops", async () => {
    seedServices();

    const res = await POST(
      makeRequest("/api/connections", {
        method: "POST",
        body: { sourceId: "svc-aa", targetId: "svc-aa" },
      })
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/cannot connect to itself/);
  });

  it("rejects non-existent source", async () => {
    seedServices();

    const res = await POST(
      makeRequest("/api/connections", {
        method: "POST",
        body: { sourceId: "nope", targetId: "svc-bb" },
      })
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/does not exist/);
  });

  it("rejects non-existent target", async () => {
    seedServices();

    const res = await POST(
      makeRequest("/api/connections", {
        method: "POST",
        body: { sourceId: "svc-aa", targetId: "nope" },
      })
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/does not exist/);
  });
});

describe("GET /api/connections", () => {
  beforeEach(() => {
    testDb = createTestDB();
  });

  it("returns empty array when no connections", async () => {
    const res = await GET(makeRequest("/api/connections"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("filters by sourceId", async () => {
    seedServices();
    await POST(
      makeRequest("/api/connections", {
        method: "POST",
        body: { sourceId: "svc-aa", targetId: "svc-bb" },
      })
    );

    const res = await GET(makeRequest("/api/connections?sourceId=svc-aa"));
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].sourceId).toBe("svc-aa");

    const res2 = await GET(makeRequest("/api/connections?sourceId=svc-bb"));
    const data2 = await res2.json();
    expect(data2).toHaveLength(0);
  });
});
