import type {
  GraphEdge,
  Criticality,
  ImpactResult,
} from "@/types";

const CRITICALITY_ORDER: Record<Criticality, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

/**
 * Build an adjacency list from edges.
 * Direction: source → target (downstream dependencies).
 * For impact analysis we need the reverse: who depends ON this service.
 */
function buildReverseDependencyMap(
  edges: GraphEdge[]
): Map<string, { neighbor: string; criticality: Criticality }[]> {
  const map = new Map<
    string,
    { neighbor: string; criticality: Criticality }[]
  >();

  for (const edge of edges) {
    // If A → B, then B going down impacts A
    const list = map.get(edge.target) ?? [];
    list.push({ neighbor: edge.source, criticality: edge.criticality });
    map.set(edge.target, list);
  }

  return map;
}

/**
 * Compute the impact of a service going down.
 * Returns all services that would be affected, directly and transitively.
 */
export function analyzeImpact(
  serviceId: string,
  edges: GraphEdge[]
): ImpactResult {
  const reverseMap = buildReverseDependencyMap(edges);
  const visited = new Set<string>();
  const directDependents: string[] = [];
  const impactChain: Record<string, string[]> = {};
  let maxCriticality: Criticality = "low";

  // BFS from the failed service
  const queue: string[] = [serviceId];
  visited.add(serviceId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const dependents = reverseMap.get(current) ?? [];
    const affectedNeighbors: string[] = [];

    for (const { neighbor, criticality } of dependents) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      queue.push(neighbor);
      affectedNeighbors.push(neighbor);

      // Track direct dependents (first hop only)
      if (current === serviceId) {
        directDependents.push(neighbor);
      }

      // Track max criticality
      if (CRITICALITY_ORDER[criticality] > CRITICALITY_ORDER[maxCriticality]) {
        maxCriticality = criticality;
      }
    }

    if (affectedNeighbors.length > 0) {
      impactChain[current] = affectedNeighbors;
    }
  }

  // Remove the source from the visited set (it's not "affected", it's the cause)
  visited.delete(serviceId);

  return {
    sourceId: serviceId,
    directDependents,
    allAffected: Array.from(visited),
    impactChain,
    maxCriticality,
  };
}
