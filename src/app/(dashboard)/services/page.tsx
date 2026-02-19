"use client";

import { useState, useMemo } from "react";
import { useServices } from "@/components/services/use-services";
import { ServiceTable } from "@/components/services/ServiceTable";
import { ServiceFilters, type Filters } from "@/components/services/ServiceFilters";

const INITIAL_FILTERS: Filters = {
  search: "",
  type: "",
  tier: "",
  owner: "",
};

export default function ServicesPage() {
  const { services, isLoading, error, refetch } = useServices();
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);

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

  return (
    <div className="p-4 sm:p-8 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Services</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filtered.length} of {services.length} services
        </p>
      </div>

      <ServiceFilters filters={filters} owners={owners} onChange={setFilters} />
      <ServiceTable services={filtered} />
    </div>
  );
}
