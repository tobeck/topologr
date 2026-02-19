import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ALL_SERVICE_TYPES, ALL_CRITICALITIES, SERVICE_TYPE_LABELS } from "@/components/graph/graph-constants";
import type { Criticality, ServiceType } from "@/types";

export interface Filters {
  search: string;
  type: ServiceType | "";
  tier: Criticality | "";
  owner: string;
}

interface ServiceFiltersProps {
  filters: Filters;
  owners: string[];
  onChange: (filters: Filters) => void;
}

export function ServiceFilters({ filters, owners, onChange }: ServiceFiltersProps) {
  const hasFilters = filters.search || filters.type || filters.tier || filters.owner;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search by name..."
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        className="w-56"
      />

      <Select
        value={filters.type || "all"}
        onValueChange={(v) => onChange({ ...filters, type: v === "all" ? "" : v as ServiceType })}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {ALL_SERVICE_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {SERVICE_TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.tier || "all"}
        onValueChange={(v) => onChange({ ...filters, tier: v === "all" ? "" : v as Criticality })}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="All tiers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All tiers</SelectItem>
          {ALL_CRITICALITIES.map((c) => (
            <SelectItem key={c} value={c} className="capitalize">
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.owner || "all"}
        onValueChange={(v) => onChange({ ...filters, owner: v === "all" ? "" : v })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All owners" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All owners</SelectItem>
          {owners.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ search: "", type: "", tier: "", owner: "" })}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
