import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDB } from "@/lib/api/test-helpers";
import { services, connections, imports } from "@/lib/db/schema";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "@/lib/db/schema";

let testDb: BetterSQLite3Database<typeof schema>;

vi.mock("@/lib/db", () => ({
  get db() {
    return testDb;
  },
}));

const { POST } = await import("./route");

function makeRequest(body: unknown) {
  return new Request("http://localhost:3000/api/import", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  }) as any;
}

const validYAML = `
services:
  - id: auth-svc
    name: Auth Service
    tier: critical
    type: service
  - id: user-svc
    name: User Service
    type: service
connections:
  - source: auth-svc
    target: user-svc
    protocol: grpc
    criticality: high
`;

describe("POST /api/import", () => {
  beforeEach(() => {
    testDb = createTestDB();
  });

  it("imports valid YAML", async () => {
    const res = await POST(makeRequest({ yaml: validYAML, filename: "test.yaml" }));

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.status).toBe("success");
    expect(data.servicesCount).toBe(2);
    expect(data.connectionsCount).toBe(1);

    // Verify data in DB
    const allServices = testDb.select().from(services).all();
    expect(allServices).toHaveLength(2);

    const allConnections = testDb.select().from(connections).all();
    expect(allConnections).toHaveLength(1);

    const allImports = testDb.select().from(imports).all();
    expect(allImports).toHaveLength(1);
    expect(allImports[0].filename).toBe("test.yaml");
  });

  it("returns 422 for invalid YAML", async () => {
    const res = await POST(makeRequest({ yaml: "not: valid: yaml: [" }));

    expect(res.status).toBe(422);
  });

  it("returns 422 for YAML with validation errors", async () => {
    const res = await POST(
      makeRequest({
        yaml: `
services:
  - id: a
    name: A
connections:
  - source: a
    target: a
`,
      })
    );

    expect(res.status).toBe(422);
  });

  it("upserts on re-import (no duplicates)", async () => {
    await POST(makeRequest({ yaml: validYAML }));
    await POST(makeRequest({ yaml: validYAML }));

    const allServices = testDb.select().from(services).all();
    expect(allServices).toHaveLength(2);

    const allConnections = testDb.select().from(connections).all();
    expect(allConnections).toHaveLength(1);

    // But two import records
    const allImports = testDb.select().from(imports).all();
    expect(allImports).toHaveLength(2);
  });

  it("returns 400 for missing yaml field", async () => {
    const res = await POST(makeRequest({ filename: "test.yaml" }));

    expect(res.status).toBe(400);
  });
});
