import { describe, it, expect } from "vitest";
import { analyzeImpact } from "./impact";
import type { GraphEdge } from "@/types";

const makeEdge = (
  source: string,
  target: string,
  criticality: "critical" | "high" | "medium" | "low" = "medium"
): GraphEdge => ({
  id: `${source}-${target}`,
  source,
  target,
  criticality,
  isAsync: false,
});

describe("analyzeImpact", () => {
  it("finds direct dependents", () => {
    // A → B → C (A depends on B, B depends on C)
    const edges = [makeEdge("a", "b"), makeEdge("b", "c")];

    // If C goes down, B is directly affected
    const result = analyzeImpact("c", edges);
    expect(result.directDependents).toEqual(["b"]);
    expect(result.allAffected).toContain("b");
    expect(result.allAffected).toContain("a");
  });

  it("finds transitive impact", () => {
    // A → B → C → D
    const edges = [
      makeEdge("a", "b"),
      makeEdge("b", "c"),
      makeEdge("c", "d"),
    ];

    // If D goes down, C, B, A are all affected
    const result = analyzeImpact("d", edges);
    expect(result.allAffected).toHaveLength(3);
    expect(result.directDependents).toEqual(["c"]);
  });

  it("handles diamond dependencies", () => {
    //   A
    //  / \
    // B   C
    //  \ /
    //   D
    const edges = [
      makeEdge("a", "b"),
      makeEdge("a", "c"),
      makeEdge("b", "d"),
      makeEdge("c", "d"),
    ];

    // If D goes down, B and C directly, A transitively
    const result = analyzeImpact("d", edges);
    expect(result.directDependents).toHaveLength(2);
    expect(result.allAffected).toHaveLength(3);
  });

  it("returns empty for a leaf service", () => {
    const edges = [makeEdge("a", "b")];

    // If A goes down, nothing depends on it
    const result = analyzeImpact("a", edges);
    expect(result.directDependents).toHaveLength(0);
    expect(result.allAffected).toHaveLength(0);
  });

  it("tracks max criticality", () => {
    const edges = [
      makeEdge("a", "b", "low"),
      makeEdge("b", "c", "critical"),
    ];

    const result = analyzeImpact("c", edges);
    expect(result.maxCriticality).toBe("critical");
  });

  it("does not include the source service in affected list", () => {
    const edges = [makeEdge("a", "b")];
    const result = analyzeImpact("b", edges);
    expect(result.allAffected).not.toContain("b");
  });
});
