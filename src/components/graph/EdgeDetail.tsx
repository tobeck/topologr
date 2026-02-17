"use client";

import type { GraphEdge, GraphNode } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CRITICALITY_COLORS } from "./graph-constants";

interface EdgeDetailProps {
  edge: GraphEdge;
}

export function EdgeDetail({ edge }: EdgeDetailProps) {
  const sourceId =
    typeof edge.source === "string"
      ? edge.source
      : (edge.source as GraphNode).id;
  const targetId =
    typeof edge.target === "string"
      ? edge.target
      : (edge.target as GraphNode).id;

  return (
    <div className="space-y-4">
      <div className="text-sm">
        <span className="font-medium">{sourceId}</span>
        <span className="mx-2 text-muted-foreground">&rarr;</span>
        <span className="font-medium">{targetId}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          style={{ backgroundColor: CRITICALITY_COLORS[edge.criticality] }}
          className="text-white"
        >
          {edge.criticality}
        </Badge>
        {edge.isAsync && <Badge variant="outline">async</Badge>}
      </div>

      {edge.label && (
        <div>
          <p className="text-xs text-muted-foreground">Label</p>
          <p className="text-sm">{edge.label}</p>
        </div>
      )}

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        {edge.protocol && (
          <div>
            <p className="text-xs text-muted-foreground">Protocol</p>
            <p className="text-sm font-medium">{edge.protocol.toUpperCase()}</p>
          </div>
        )}
        {edge.port && (
          <div>
            <p className="text-xs text-muted-foreground">Port</p>
            <p className="text-sm font-medium">{edge.port}</p>
          </div>
        )}
        {edge.authMethod && (
          <div>
            <p className="text-xs text-muted-foreground">Auth</p>
            <p className="text-sm font-medium">{edge.authMethod}</p>
          </div>
        )}
      </div>

      {(edge.slaTargetMs || edge.slaUptimePercent) && (
        <>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-2">SLA</p>
            <div className="grid grid-cols-2 gap-3">
              {edge.slaTargetMs && (
                <div>
                  <p className="text-xs text-muted-foreground">Latency target</p>
                  <p className="text-sm font-medium">{edge.slaTargetMs}ms</p>
                </div>
              )}
              {edge.slaUptimePercent && (
                <div>
                  <p className="text-xs text-muted-foreground">Uptime target</p>
                  <p className="text-sm font-medium">{edge.slaUptimePercent}%</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
