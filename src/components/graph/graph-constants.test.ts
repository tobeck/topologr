import { describe, it, expect } from "vitest";
import {
  CRITICALITY_COLORS,
  EDGE_WIDTH,
  NODE_COLORS,
  TIER_STROKE,
  SERVICE_TYPE_LABELS,
  ALL_SERVICE_TYPES,
  ALL_CRITICALITIES,
  nodeShapePath,
} from "./graph-constants";

describe("graph-constants", () => {
  it("has a color for every criticality level", () => {
    for (const crit of ALL_CRITICALITIES) {
      expect(CRITICALITY_COLORS[crit]).toBeDefined();
      expect(CRITICALITY_COLORS[crit]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("has edge width for every criticality level", () => {
    for (const crit of ALL_CRITICALITIES) {
      expect(EDGE_WIDTH[crit]).toBeGreaterThan(0);
    }
  });

  it("has a color for every service type", () => {
    for (const type of ALL_SERVICE_TYPES) {
      expect(NODE_COLORS[type]).toBeDefined();
      expect(NODE_COLORS[type]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("has a tier stroke for every criticality level", () => {
    for (const crit of ALL_CRITICALITIES) {
      expect(TIER_STROKE[crit]).toBeDefined();
    }
  });

  it("has a label for every service type", () => {
    for (const type of ALL_SERVICE_TYPES) {
      expect(SERVICE_TYPE_LABELS[type]).toBeDefined();
      expect(SERVICE_TYPE_LABELS[type].length).toBeGreaterThan(0);
    }
  });

  it("generates a shape path for database, cache, external, and cdn", () => {
    expect(nodeShapePath("database")).toContain("M");
    expect(nodeShapePath("cache")).toContain("M");
    expect(nodeShapePath("external")).toContain("M");
    expect(nodeShapePath("cdn")).toContain("M");
  });

  it("returns empty string for circle-based and rect-based types", () => {
    expect(nodeShapePath("service")).toBe("");
    expect(nodeShapePath("queue")).toBe("");
    expect(nodeShapePath("storage")).toBe("");
  });
});
