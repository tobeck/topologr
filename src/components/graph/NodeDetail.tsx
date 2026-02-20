"use client";

import type { GraphNode, GraphEdge, ImpactResult } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ImpactSummary } from "@/components/impact/ImpactSummary";
import {
  CRITICALITY_COLORS,
  SERVICE_TYPE_LABELS,
} from "./graph-constants";
import {
  ExternalLink,
  GitBranch,
  FileText,
  Target,
  Eye,
  Loader2,
} from "lucide-react";

interface NodeDetailProps {
  node: GraphNode;
  edges: GraphEdge[];
  onAnalyzeImpact: (nodeId: string) => void;
  impactResult?: ImpactResult | null;
  isLoadingImpact?: boolean;
  allNodes?: GraphNode[];
  onInlineImpact?: (nodeId: string) => void;
  onViewInGraph?: (nodeId: string) => void;
}

export function NodeDetail({
  node,
  edges,
  onAnalyzeImpact,
  impactResult,
  isLoadingImpact,
  allNodes,
  onInlineImpact,
  onViewInGraph,
}: NodeDetailProps) {
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

      {node.description && (
        <p className="text-sm text-muted-foreground">{node.description}</p>
      )}

      {(node.repository || node.documentation) && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Links</p>
          <div className="flex flex-col gap-1">
            {node.repository && (
              <a
                href={node.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                <GitBranch className="h-3 w-3" />
                Repository
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {node.documentation && (
              <a
                href={node.documentation}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                <FileText className="h-3 w-3" />
                Documentation
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}

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

      {onInlineImpact ? (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={isLoadingImpact}
            onClick={() => onInlineImpact(node.id)}
          >
            {isLoadingImpact ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Target className="h-4 w-4 mr-2" />
            )}
            Analyze Impact
          </Button>
          {onViewInGraph && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onViewInGraph(node.id)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View in Graph
            </Button>
          )}
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onAnalyzeImpact(node.id)}
        >
          <Target className="h-4 w-4 mr-2" />
          Analyze Impact
        </Button>
      )}

      {impactResult && allNodes && (
        <div className="mt-3">
          <Separator className="mb-3" />
          <ImpactSummary impactResult={impactResult} nodes={allNodes} compact />
        </div>
      )}
    </div>
  );
}
