"use client";

import { useState } from "react";
import type { ImpactResult, GraphNode, Criticality } from "@/types";
import { Badge } from "@/components/ui/badge";
import { CRITICALITY_COLORS, getHopColor } from "@/components/graph/graph-constants";

interface ImpactSummaryProps {
  impactResult: ImpactResult;
  nodes: GraphNode[];
  compact?: boolean;
}

const COMPACT_LIMIT = 5;

function nodeName(id: string, nodes: GraphNode[]): string {
  return nodes.find((n) => n.id === id)?.name ?? id;
}

function nodeTier(id: string, nodes: GraphNode[]): Criticality | undefined {
  return nodes.find((n) => n.id === id)?.tier;
}

export function ImpactSummary({ impactResult, nodes, compact = false }: ImpactSummaryProps) {
  const [expandedHops, setExpandedHops] = useState<Set<number>>(new Set());

  const { allAffected, directDependents, maxCriticality, hopDistance } = impactResult;

  // Group affected services by hop distance
  const byHop = new Map<number, string[]>();
  for (const id of allAffected) {
    const hop = hopDistance[id] ?? 0;
    const list = byHop.get(hop) ?? [];
    list.push(id);
    byHop.set(hop, list);
  }
  const sortedHops = Array.from(byHop.keys()).sort((a, b) => a - b);

  return (
    <div className="space-y-3">
      {/* Stats row */}
      <div className="flex gap-3 text-sm">
        <div className="text-center">
          <div className="text-lg font-bold">{allAffected.length}</div>
          <div className="text-xs text-muted-foreground">affected</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{directDependents.length}</div>
          <div className="text-xs text-muted-foreground">direct</div>
        </div>
        <div className="text-center">
          <Badge
            style={{ backgroundColor: CRITICALITY_COLORS[maxCriticality] }}
            className="text-white text-xs"
          >
            {maxCriticality}
          </Badge>
          <div className="text-xs text-muted-foreground mt-0.5">max severity</div>
        </div>
      </div>

      {/* Grouped by hop distance */}
      {sortedHops.map((hop) => {
        const serviceIds = byHop.get(hop) ?? [];
        const isExpanded = expandedHops.has(hop);
        const showAll = !compact || isExpanded;
        const visible = showAll ? serviceIds : serviceIds.slice(0, COMPACT_LIMIT);
        const remaining = serviceIds.length - COMPACT_LIMIT;

        return (
          <div key={hop}>
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getHopColor(hop) }}
              />
              <span className="text-xs font-medium text-muted-foreground">
                Hop {hop} ({serviceIds.length})
              </span>
            </div>
            <div className="space-y-0.5 pl-4">
              {visible.map((id) => {
                const tier = nodeTier(id, nodes);
                return (
                  <div key={id} className="flex items-center gap-1.5 text-sm">
                    <span>{nodeName(id, nodes)}</span>
                    {tier && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0"
                        style={{ borderColor: CRITICALITY_COLORS[tier] }}
                      >
                        {tier}
                      </Badge>
                    )}
                  </div>
                );
              })}
              {compact && !isExpanded && remaining > 0 && (
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => setExpandedHops((prev) => new Set(prev).add(hop))}
                >
                  +{remaining} more
                </button>
              )}
            </div>
          </div>
        );
      })}

      {allAffected.length === 0 && (
        <p className="text-sm text-muted-foreground">No services affected.</p>
      )}
    </div>
  );
}
