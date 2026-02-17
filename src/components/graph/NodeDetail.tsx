"use client";

import type { GraphNode, GraphEdge } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CRITICALITY_COLORS,
  SERVICE_TYPE_LABELS,
} from "./graph-constants";
import {
  ExternalLink,
  GitBranch,
  FileText,
  Target,
} from "lucide-react";

interface NodeDetailProps {
  node: GraphNode;
  edges: GraphEdge[];
  onAnalyzeImpact: (nodeId: string) => void;
}

export function NodeDetail({ node, edges, onAnalyzeImpact }: NodeDetailProps) {
  const inbound = edges.filter((e) => {
    const target = typeof e.target === "string" ? e.target : (e.target as GraphNode).id;
    return target === node.id;
  });
  const outbound = edges.filter((e) => {
    const source = typeof e.source === "string" ? e.source : (e.source as GraphNode).id;
    return source === node.id;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          style={{ backgroundColor: CRITICALITY_COLORS[node.tier] }}
          className="text-white"
        >
          {node.tier}
        </Badge>
        <Badge variant="outline">{SERVICE_TYPE_LABELS[node.type]}</Badge>
      </div>

      {node.owner && (
        <div>
          <p className="text-xs text-muted-foreground">Owner</p>
          <p className="text-sm font-medium">{node.owner}</p>
        </div>
      )}

      {node.tags.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Tags</p>
          <div className="flex gap-1 flex-wrap">
            {node.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Separator />

      <div>
        <p className="text-xs text-muted-foreground mb-2">
          Connections ({inbound.length} in, {outbound.length} out)
        </p>
        {outbound.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-medium mb-1">Outbound</p>
            {outbound.map((e) => {
              const targetId = typeof e.target === "string" ? e.target : (e.target as GraphNode).id;
              return (
                <div
                  key={e.id}
                  className="text-xs text-muted-foreground flex items-center gap-1"
                >
                  <span className="text-foreground">{targetId}</span>
                  {e.label && <span>({e.label})</span>}
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: CRITICALITY_COLORS[e.criticality] }}
                  />
                </div>
              );
            })}
          </div>
        )}
        {inbound.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-1">Inbound</p>
            {inbound.map((e) => {
              const sourceId = typeof e.source === "string" ? e.source : (e.source as GraphNode).id;
              return (
                <div
                  key={e.id}
                  className="text-xs text-muted-foreground flex items-center gap-1"
                >
                  <span className="text-foreground">{sourceId}</span>
                  {e.label && <span>({e.label})</span>}
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: CRITICALITY_COLORS[e.criticality] }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => onAnalyzeImpact(node.id)}
      >
        <Target className="h-4 w-4 mr-2" />
        Analyze Impact
      </Button>
    </div>
  );
}
