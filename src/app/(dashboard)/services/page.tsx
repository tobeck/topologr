"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useServices, type ApiService } from "@/components/services/use-services";
import { useConnections } from "@/components/services/use-connections";
import { ServiceTable } from "@/components/services/ServiceTable";
import { ServiceFilters, type Filters } from "@/components/services/ServiceFilters";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { NodeDetail } from "@/components/graph/NodeDetail";
import type { GraphNode, GraphEdge, ImpactResult } from "@/types";

const INITIAL_FILTERS: Filters = {
  search: "",
  type: "",
  tier: "",
  owner: "",
};

function toGraphNode(service: ApiService): GraphNode {
  return {
    id: service.id,
    name: service.name,
    type: service.type,
    tier: service.tier,
    owner: service.owner ?? undefined,
    repository: service.repository ?? undefined,
    documentation: service.documentation ?? undefined,
    description: service.description ?? undefined,
    tags: service.tags,
  };
}

export default function ServicesPage() {
  const { services, isLoading, error, refetch } = useServices();
  const { connections } = useConnections();
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [selectedService, setSelectedService] = useState<ApiService | null>(null);
  const [inlineImpact, setInlineImpact] = useState<ImpactResult | null>(null);
  const [isLoadingImpact, setIsLoadingImpact] = useState(false);
  const router = useRouter();

  const owners = useMemo(() => {
    const set = new Set<string>();
    for (const s of services) {
      if (s.owner) set.add(s.owner);
    }
    return Array.from(set).sort();
  }, [services]);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (filters.search && !s.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.type && s.type !== filters.type) return false;
      if (filters.tier && s.tier !== filters.tier) return false;
      if (filters.owner && s.owner !== filters.owner) return false;
      return true;
    });
  }, [services, filters]);

  const graphEdges: GraphEdge[] = useMemo(() => {
    return connections.map((c) => ({
      id: c.id,
      source: c.sourceId,
      target: c.targetId,
      label: c.label ?? undefined,
      protocol: c.protocol,
      port: c.port ?? undefined,
      criticality: c.criticality,
      slaTargetMs: c.slaTargetMs ?? undefined,
      slaUptimePercent: c.slaUptimePercent ?? undefined,
      authMethod: c.authMethod ?? undefined,
      isAsync: c.isAsync,
    }));
  }, [connections]);

  const handleViewInGraph = useCallback(
    (nodeId: string) => {
      router.push(`/graph?analyze=${encodeURIComponent(nodeId)}`);
    },
    [router],
  );

  const handleInlineImpact = useCallback(async (nodeId: string) => {
    setIsLoadingImpact(true);
    try {
      const res = await fetch(`/api/impact/${encodeURIComponent(nodeId)}`);
      if (!res.ok) throw new Error("Failed to fetch impact analysis");
      const body = await res.json();
      setInlineImpact(body);
    } catch {
      setInlineImpact(null);
    } finally {
      setIsLoadingImpact(false);
    }
  }, []);

  const handleSelectService = useCallback((service: ApiService | null) => {
    setSelectedService(service);
    setInlineImpact(null);
    setIsLoadingImpact(false);
  }, []);

  const allNodes: GraphNode[] = useMemo(() => services.map(toGraphNode), [services]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">{error}</p>
          <button onClick={refetch} className="text-sm text-primary underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
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

  const selectedNode = selectedService ? toGraphNode(selectedService) : null;

  return (
    <div className="p-4 sm:p-8 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Services</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filtered.length} of {services.length} services
        </p>
      </div>

      <ServiceFilters filters={filters} owners={owners} onChange={setFilters} />
      <ServiceTable services={filtered} onSelectService={handleSelectService} />

      <Sheet
        open={!!selectedService}
        onOpenChange={(isOpen) => !isOpen && handleSelectService(null)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedNode?.name}</SheetTitle>
            <SheetDescription>{selectedNode?.type} service</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            {selectedNode && (
              <NodeDetail
                node={selectedNode}
                edges={graphEdges}
                onAnalyzeImpact={handleViewInGraph}
                impactResult={inlineImpact}
                isLoadingImpact={isLoadingImpact}
                allNodes={allNodes}
                onInlineImpact={handleInlineImpact}
                onViewInGraph={handleViewInGraph}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
