import { describe, it, expect } from "vitest";
import { parseServiceYAML } from "./parser";

describe("parseServiceYAML", () => {
  it("parses a valid minimal document", () => {
    const yaml = `
services:
  - id: my-service
    name: My Service
connections: []
`;
    const result = parseServiceYAML(yaml);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.services).toHaveLength(1);
      expect(result.data.services[0].id).toBe("my-service");
      expect(result.data.services[0].tier).toBe("medium"); // default
    }
  });

  it("parses connections with SLA fields", () => {
    const yaml = `
services:
  - id: service-a
    name: Service A
  - id: service-b
    name: Service B
connections:
  - source: service-a
    target: service-b
    protocol: https
    port: 443
    sla_target_ms: 200
    sla_uptime_percent: 99.95
    criticality: critical
`;
    const result = parseServiceYAML(yaml);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.connections[0].sla_target_ms).toBe(200);
      expect(result.data.connections[0].sla_uptime_percent).toBe(99.95);
      expect(result.data.connections[0].criticality).toBe("critical");
    }
  });

  it("rejects tabs in YAML", () => {
    const yaml = "services:\n\t- id: bad\n\t  name: Bad";
    const result = parseServiceYAML(yaml);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain("tab");
    }
  });

  it("rejects empty input", () => {
    const result = parseServiceYAML("");
    expect(result.success).toBe(false);
  });

  it("rejects duplicate service IDs", () => {
    const yaml = `
services:
  - id: my-service
    name: First
  - id: my-service
    name: Duplicate
`;
    const result = parseServiceYAML(yaml);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain("Duplicate");
    }
  });

  it("rejects connections referencing non-existent services", () => {
    const yaml = `
services:
  - id: service-a
    name: Service A
connections:
  - source: service-a
    target: service-z
`;
    const result = parseServiceYAML(yaml);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain("not defined");
    }
  });

  it("rejects self-loops", () => {
    const yaml = `
services:
  - id: service-a
    name: Service A
connections:
  - source: service-a
    target: service-a
`;
    const result = parseServiceYAML(yaml);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain("cannot connect to itself");
    }
  });

  it("rejects invalid service IDs", () => {
    const yaml = `
services:
  - id: My Service!
    name: Bad ID
`;
    const result = parseServiceYAML(yaml);
    expect(result.success).toBe(false);
  });

  it("requires at least one service", () => {
    const yaml = `
services: []
connections: []
`;
    const result = parseServiceYAML(yaml);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]).toContain("At least one service");
    }
  });

  it("defaults omitted connection fields", () => {
    const yaml = `
services:
  - id: service-a
    name: Service A
  - id: service-b
    name: Service B
connections:
  - source: service-a
    target: service-b
`;
    const result = parseServiceYAML(yaml);
    expect(result.success).toBe(true);
    if (result.success) {
      const conn = result.data.connections[0];
      expect(conn.protocol).toBe("https");
      expect(conn.criticality).toBe("medium");
      expect(conn.is_async).toBe(false);
    }
  });
});
