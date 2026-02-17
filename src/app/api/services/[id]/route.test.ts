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

const { GET, PUT, DELETE: DEL } = await import("./route");

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

function seedService(id: string, name: string) {
  const now = new Date();
  testDb.insert(services).values({
    id,
    name,
    tier: "medium",
    type: "service",
    createdAt: now,
    updatedAt: now,
  }).run();
}

describe("GET /api/services/:id", () => {
  beforeEach(() => {
    testDb = createTestDB();
  });

  it("returns a service by id", async () => {
    seedService("auth-svc", "Auth Service");

    const res = await GET(makeRequest("/api/services/auth-svc"), {
      params: Promise.resolve({ id: "auth-svc" }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("auth-svc");
  });

  it("returns 404 for missing service", async () => {
    const res = await GET(makeRequest("/api/services/nope"), {
      params: Promise.resolve({ id: "nope" }),
    });

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/services/:id", () => {
  beforeEach(() => {
    testDb = createTestDB();
  });

  it("updates a service", async () => {
    seedService("auth-svc", "Auth Service");

    const res = await PUT(
      makeRequest("/api/services/auth-svc", {
        method: "PUT",
        body: { name: "Updated Auth", tier: "critical" },
      }),
      { params: Promise.resolve({ id: "auth-svc" }) }
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("Updated Auth");
    expect(data.tier).toBe("critical");
  });

  it("returns 404 for missing service", async () => {
    const res = await PUT(
      makeRequest("/api/services/nope", {
        method: "PUT",
        body: { name: "X" },
      }),
      { params: Promise.resolve({ id: "nope" }) }
    );

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/services/:id", () => {
  beforeEach(() => {
    testDb = createTestDB();
  });

  it("deletes a service", async () => {
    seedService("auth-svc", "Auth Service");

    const res = await DEL(makeRequest("/api/services/auth-svc", { method: "DELETE" }), {
      params: Promise.resolve({ id: "auth-svc" }),
    });

    expect(res.status).toBe(204);
  });

  it("returns 404 for missing service", async () => {
    const res = await DEL(makeRequest("/api/services/nope", { method: "DELETE" }), {
      params: Promise.resolve({ id: "nope" }),
    });

    expect(res.status).toBe(404);
  });
});
