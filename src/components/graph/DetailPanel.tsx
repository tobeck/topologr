"use client";

import type { GraphNode, GraphEdge } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { NodeDetail } from "./NodeDetail";
import { EdgeDetail } from "./EdgeDetail";

interface DetailPanelProps {
  selectedNode: GraphNode | null;
  selectedEdge: GraphEdge | null;
  edges: GraphEdge[];
  open: boolean;
  onClose: () => void;
  onAnalyzeImpact: (nodeId: string) => void;
}

export function DetailPanel({
  selectedNode,
  selectedEdge,
  edges,
  open,
  onClose,
  onAnalyzeImpact,
}: DetailPanelProps) {
  const title = selectedNode
    ? selectedNode.name
    : selectedEdge
      ? "Connection"
      : "";

  const description = selectedNode
    ? `${selectedNode.type} service`
    : selectedEdge
      ? `${typeof selectedEdge.source === "string" ? selectedEdge.source : (selectedEdge.source as GraphNode).id} → ${typeof selectedEdge.target === "string" ? selectedEdge.target : (selectedEdge.target as GraphNode).id}`
      : "";

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          {selectedNode && (
            <NodeDetail
              node={selectedNode}
              edges={edges}
              onAnalyzeImpact={onAnalyzeImpact}
            />
          )}
          {selectedEdge && <EdgeDetail edge={selectedEdge} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
