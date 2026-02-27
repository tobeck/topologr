"use client";

import { Suspense, useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ServiceGraphClient } from "@/components/graph/ServiceGraph.client";
import { GraphControls } from "@/components/graph/GraphControls";
import { DetailPanel } from "@/components/graph/DetailPanel";
import { ImpactSummaryPanel } from "@/components/graph/ImpactSummaryPanel";
import { useGraphData } from "@/components/graph/use-graph-data";
import type { ServiceGraphHandle } from "@/components/graph/ServiceGraph";
import type { GraphNode, GraphEdge, ImpactResult } from "@/types";

export default function GraphPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <GraphPageContent />
    </Suspense>
  );
}

function GraphPageContent() {
  const { graph, isLoading, error, refetch } = useGraphData();
  const graphRef = useRef<ServiceGraphHandle>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasAutoAnalyzed = useRef(false);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [impactResult, setImpactResult] = useState<ImpactResult | null>(null);
  const [isImpactMode, setIsImpactMode] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  // Auto-trigger impact analysis from ?analyze= query param
  useEffect(() => {
    if (hasAutoAnalyzed.current || !graph || graph.nodes.length === 0) return;
    const analyzeId = searchParams.get("analyze");
    if (!analyzeId) return;

    hasAutoAnalyzed.current = true;
    router.replace("/graph", { scroll: false });

    setIsImpactMode(true);
    fetch(`/api/impact/${encodeURIComponent(analyzeId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch impact analysis");
        return res.json();
      })
      .then((body) => setImpactResult(body))
      .catch(() => setImpactResult(null));
  }, [graph, searchParams, router]);

  const handleNodeClick = useCallback(
    async (node: GraphNode) => {
      if (isImpactMode) {
        try {
          const res = await fetch(`/api/impact/${node.id}`);
          if (!res.ok) throw new Error("Failed to fetch impact analysis");
          const body = await res.json();
          setImpactResult(body);
        } catch {
          setImpactResult(null);
        }
        return;
      }

      setSelectedEdge(null);
      setSelectedNode(node);
      setPanelOpen(true);
    },
    [isImpactMode]
  );

  const handleEdgeClick = useCallback(
    (edge: GraphEdge) => {
      if (isImpactMode) return;
      setSelectedNode(null);
      setSelectedEdge(edge);
      setPanelOpen(true);
    },
    [isImpactMode]
  );

  const handleAnalyzeImpact = useCallback(async (nodeId: string) => {
    setPanelOpen(false);
    setIsImpactMode(true);
    try {
      const res = await fetch(`/api/impact/${nodeId}`);
      if (!res.ok) throw new Error("Failed to fetch impact analysis");
      const body = await res.json();
      setImpactResult(body);
    } catch {
      setImpactResult(null);
    }
  }, []);

  const handleToggleImpactMode = useCallback(() => {
    setIsImpactMode((prev) => {
      if (prev) {
        setImpactResult(null);
      }
      return !prev;
    });
  }, []);

  const handleClosePanel = useCallback(() => {
    setPanelOpen(false);
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const handleExitImpact = useCallback(() => {
    setIsImpactMode(false);
    setImpactResult(null);
  }, []);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">{error}</p>
          <button
            onClick={refetch}
            className="text-sm text-primary underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !graph) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  if (graph.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">
            No services found. Import a YAML file to get started.
          </p>
          <a href="/import" className="text-sm text-primary underline">
            Import services
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative overflow-hidden">
      {isImpactMode && !impactResult && (
        <div className="absolute top-4 left-4 z-10 bg-destructive/10 border border-destructive/30 rounded-md px-3 py-1.5 text-sm text-destructive flex items-center gap-2">
          Click a node to analyze blast radius
          <button
            className="text-destructive hover:underline text-xs font-medium"
            onClick={handleExitImpact}
          >
            Cancel
          </button>
        </div>
      )}

      {impactResult && (
        <ImpactSummaryPanel
          impactResult={impactResult}
          nodes={graph.nodes}
          onClose={handleExitImpact}
        />
      )}

      <ServiceGraphClient
        ref={graphRef}
        graph={graph}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        impactResult={impactResult}
      />

      <GraphControls
        onZoomIn={() => graphRef.current?.zoomIn()}
        onZoomOut={() => graphRef.current?.zoomOut()}
        onResetZoom={() => graphRef.current?.resetZoom()}
        isImpactMode={isImpactMode}
        onToggleImpactMode={handleToggleImpactMode}
      />

      <DetailPanel
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        edges={graph.edges}
        open={panelOpen}
        onClose={handleClosePanel}
        onAnalyzeImpact={handleAnalyzeImpact}
      />
    </div>
  );
}
