"use client";

import { useState, useEffect, useCallback } from "react";
import type { Criticality, ServiceType } from "@/types";

export interface ApiService {
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

interface UseServicesReturn {
  services: ApiService[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useServices(): UseServicesReturn {
  const [services, setServices] = useState<ApiService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/services");
      if (!res.ok) {
        throw new Error(`Failed to fetch services: ${res.status}`);
      }

      const body = await res.json();
      const data = Array.isArray(body) ? body : body.data;
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch services");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { services, isLoading, error, refetch: fetchData };
}
