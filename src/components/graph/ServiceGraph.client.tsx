"use client";

import dynamic from "next/dynamic";
import type { ServiceGraphHandle } from "./ServiceGraph";
import type { GraphNode, GraphEdge, ServiceGraph, ImpactResult } from "@/types";
import { forwardRef } from "react";

const ServiceGraphLazy = dynamic(
  () => import("./ServiceGraph").then((mod) => mod.ServiceGraph),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading graph...</p>
        </div>
      </div>
    ),
  }
);

interface ServiceGraphClientProps {
  graph: ServiceGraph;
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  impactResult?: ImpactResult | null;
}

export const ServiceGraphClient = forwardRef<
  ServiceGraphHandle,
  ServiceGraphClientProps
>(function ServiceGraphClient(props, ref) {
  return <ServiceGraphLazy ref={ref} {...props} />;
});
