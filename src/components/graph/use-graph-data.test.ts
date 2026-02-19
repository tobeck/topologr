import { describe, it, expect } from "vitest";
import { mapServicesToNodes, mapConnectionsToEdges } from "./use-graph-data";

describe("mapServicesToNodes", () => {
  it("maps API services to GraphNode array", () => {
    const services = [
      {
        id: "auth-service",
        name: "Auth Service",
        type: "service" as const,
        tier: "critical" as const,
        owner: "platform-team",
        tags: ["auth", "core"],
        repository: "https://github.com/org/auth",
        documentation: "https://docs.internal/auth",
        description: "Handles authentication",
        metadata: null,
      },
      {
        id: "user-db",
        name: "User Database",
        type: "database" as const,
        tier: "high" as const,
        owner: null,
        tags: [],
        repository: null,
        documentation: null,
        description: null,
        metadata: null,
      },
    ];

    const nodes = mapServicesToNodes(services);

    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toEqual({
      id: "auth-service",
      name: "Auth Service",
      type: "service",
      tier: "critical",
      owner: "platform-team",
      repository: "https://github.com/org/auth",
      documentation: "https://docs.internal/auth",
      description: "Handles authentication",
      tags: ["auth", "core"],
    });
    expect(nodes[1]).toEqual({
      id: "user-db",
      name: "User Database",
      type: "database",
      tier: "high",
      owner: undefined,
      repository: undefined,
      documentation: undefined,
      description: undefined,
      tags: [],
    });
  });
});

describe("mapConnectionsToEdges", () => {
  it("maps API connections to GraphEdge array with renamed fields", () => {
    const connections = [
      {
        id: "conn-1",
        sourceId: "auth-service",
        targetId: "user-db",
        label: "SQL",
        protocol: "postgres" as const,
        port: 5432,
        criticality: "critical" as const,
        slaTargetMs: 50,
        slaUptimePercent: 99.99,
        authMethod: "mtls" as const,
        isAsync: false,
        description: null,
        metadata: null,
      },
      {
        id: "conn-2",
        sourceId: "api-gw",
        targetId: "queue",
        label: null,
        protocol: null,
        port: null,
        criticality: "low" as const,
        slaTargetMs: null,
        slaUptimePercent: null,
        authMethod: null,
        isAsync: true,
        description: null,
        metadata: null,
      },
    ];

    const edges = mapConnectionsToEdges(connections);

    expect(edges).toHaveLength(2);
    expect(edges[0]).toEqual({
      id: "conn-1",
      source: "auth-service",
      target: "user-db",
      label: "SQL",
      protocol: "postgres",
      port: 5432,
      criticality: "critical",
      slaTargetMs: 50,
      slaUptimePercent: 99.99,
      authMethod: "mtls",
      isAsync: false,
    });
    expect(edges[1]).toEqual({
      id: "conn-2",
      source: "api-gw",
      target: "queue",
      label: undefined,
      protocol: undefined,
      port: undefined,
      criticality: "low",
      slaTargetMs: undefined,
      slaUptimePercent: undefined,
      authMethod: undefined,
      isAsync: true,
    });
  });
});
