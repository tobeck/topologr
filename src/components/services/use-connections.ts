"use client";

import { useState, useEffect, useCallback } from "react";
import type { Criticality, Protocol, AuthMethod } from "@/types";

export interface ApiConnection {
  id: string;
  sourceId: string;
  targetId: string;
  label: string | null;
  protocol: Protocol;
  port: number | null;
  description: string | null;
  criticality: Criticality;
  slaTargetMs: number | null;
  slaUptimePercent: number | null;
  authMethod: AuthMethod | null;
  isAsync: boolean;
  metadata: Record<string, unknown> | null;
}

interface UseConnectionsReturn {
  connections: ApiConnection[];
  isLoading: boolean;
  error: string | null;
}

export function useConnections(): UseConnectionsReturn {
  const [connections, setConnections] = useState<ApiConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/connections");
      if (!res.ok) {
        throw new Error(`Failed to fetch connections: ${res.status}`);
      }

      const body = await res.json();
      const data = Array.isArray(body) ? body : body.data;
      setConnections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch connections");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { connections, isLoading, error };
}
