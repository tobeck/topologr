"use client";

import type { ImpactResult, GraphNode } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImpactSummary } from "@/components/impact/ImpactSummary";
import { X } from "lucide-react";

interface ImpactSummaryPanelProps {
  impactResult: ImpactResult;
  nodes: GraphNode[];
  onClose: () => void;
}

function nodeName(id: string, nodes: GraphNode[]): string {
  return nodes.find((n) => n.id === id)?.name ?? id;
}

export function ImpactSummaryPanel({ impactResult, nodes, onClose }: ImpactSummaryPanelProps) {
  return (
    <Card className="absolute left-4 top-16 bottom-4 w-72 z-10 overflow-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {nodeName(impactResult.sourceId, nodes)}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Blast radius analysis</p>
      </CardHeader>
      <CardContent className="pt-0">
        <ImpactSummary impactResult={impactResult} nodes={nodes} />

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          onClick={onClose}
        >
          Exit Impact Mode
        </Button>
      </CardContent>
    </Card>
  );
}
