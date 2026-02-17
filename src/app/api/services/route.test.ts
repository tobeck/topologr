import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDB, buildRequest } from "@/lib/api/test-helpers";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "@/lib/db/schema";

let testDb: BetterSQLite3Database<typeof schema>;

vi.mock("@/lib/db", () => ({
  get db() {
    return testDb;
  },
}));

// Import after mock is set up
const { GET, POST } = await import("./route");

function makeRequest(url: string, opts?: { method?: string; body?: unknown }) {
  // NextRequest compatible
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

describe("GET /api/services", () => {
  beforeEach(() => {
    testDb = createTestDB();
  });

  it("returns empty array when no services", async () => {
    const res = await GET(makeRequest("/api/services"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns all services", async () => {
    // Create a service via POST first
    await POST(
      makeRequest("/api/services", {
        method: "POST",
        body: { id: "auth-svc", name: "Auth Service" },
      })
    );

    const res = await GET(makeRequest("/api/services"));
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("auth-svc");
    expect(data[0].tags).toEqual([]);
  });

  it("filters by owner", async () => {
    await POST(
      makeRequest("/api/services", {
        method: "POST",
        body: { id: "svc-aa", name: "A", owner: "team-a" },
      })
    );
    await POST(
      makeRequest("/api/services", {
        method: "POST",
        body: { id: "svc-bb", name: "B", owner: "team-b" },
      })
    );

    const res = await GET(makeRequest("/api/services?owner=team-a"));
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("svc-aa");
  });
});

describe("POST /api/services", () => {
  beforeEach(() => {
    testDb = createTestDB();
  });

  it("creates a service", async () => {
    const res = await POST(
      makeRequest("/api/services", {
        method: "POST",
        body: {
          id: "auth-svc",
          name: "Auth Service",
          owner: "platform",
          tags: ["auth", "core"],
        },
      })
    );

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe("auth-svc");
    expect(data.name).toBe("Auth Service");
    expect(data.tags).toEqual(["auth", "core"]);
    expect(data.tier).toBe("medium");
  });

  it("returns 409 on duplicate id", async () => {
    await POST(
      makeRequest("/api/services", {
        method: "POST",
        body: { id: "auth-svc", name: "Auth Service" },
      })
    );

    const res = await POST(
      makeRequest("/api/services", {
        method: "POST",
        body: { id: "auth-svc", name: "Auth Service 2" },
      })
    );

    expect(res.status).toBe(409);
  });

  it("returns 400 on invalid data", async () => {
    const res = await POST(
      makeRequest("/api/services", {
        method: "POST",
        body: { id: "INVALID ID", name: "" },
      })
    );

    expect(res.status).toBe(400);
  });
});
