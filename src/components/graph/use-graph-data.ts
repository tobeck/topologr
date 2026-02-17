"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  GraphNode,
  GraphEdge,
  ServiceGraph,
  Criticality,
  ServiceType,
  Protocol,
  AuthMethod,
} from "@/types";

interface ApiService {
  id: string;
  name: string;
  type: ServiceType;
  tier: Criticality;
  owner: string | null;
  tags: string[];
  repository: string | null;
  documentation: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
}

interface ApiConnection {
  id: string;
  sourceId: string;
  targetId: string;
  label: string | null;
  protocol: Protocol | null;
  port: number | null;
  criticality: Criticality;
  slaTargetMs: number | null;
  slaUptimePercent: number | null;
  authMethod: AuthMethod | null;
  isAsync: boolean;
  description: string | null;
  metadata: Record<string, unknown> | null;
}

interface UseGraphDataReturn {
  graph: ServiceGraph | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function mapServicesToNodes(services: ApiService[]): GraphNode[] {
  return services.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    tier: s.tier,
    owner: s.owner ?? undefined,
    tags: s.tags ?? [],
  }));
}

export function mapConnectionsToEdges(connections: ApiConnection[]): GraphEdge[] {
  return connections.map((c) => ({
    id: c.id,
    source: c.sourceId,
    target: c.targetId,
    label: c.label ?? undefined,
    protocol: c.protocol ?? undefined,
    port: c.port ?? undefined,
    criticality: c.criticality ?? "medium",
    slaTargetMs: c.slaTargetMs ?? undefined,
    slaUptimePercent: c.slaUptimePercent ?? undefined,
    authMethod: c.authMethod ?? undefined,
    isAsync: c.isAsync,
  }));
}

export function useGraphData(): UseGraphDataReturn {
  const [graph, setGraph] = useState<ServiceGraph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [servicesRes, connectionsRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/connections"),
      ]);

      if (!servicesRes.ok) {
        throw new Error(`Failed to fetch services: ${servicesRes.status}`);
      }
      if (!connectionsRes.ok) {
        throw new Error(`Failed to fetch connections: ${connectionsRes.status}`);
      }

      const servicesBody = await servicesRes.json();
      const connectionsBody = await connectionsRes.json();

      const servicesData = Array.isArray(servicesBody) ? servicesBody : servicesBody.data;
      const connectionsData = Array.isArray(connectionsBody) ? connectionsBody : connectionsBody.data;

      const nodes = mapServicesToNodes(servicesData);
      const edges = mapConnectionsToEdges(connectionsData);

      setGraph({ nodes, edges });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch graph data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { graph, isLoading, error, refetch: fetchData };
}
