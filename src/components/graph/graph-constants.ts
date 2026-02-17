import type { Criticality, ServiceType } from "@/types";

export const NODE_RADIUS = 24;

export const CRITICALITY_COLORS: Record<Criticality, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

export const EDGE_WIDTH: Record<Criticality, number> = {
  critical: 2,
  high: 1.5,
  medium: 1,
  low: 0.75,
};

export const NODE_COLORS: Record<ServiceType, string> = {
  service: "#3b82f6",
  database: "#8b5cf6",
  queue: "#f59e0b",
  cache: "#10b981",
  external: "#6b7280",
  cdn: "#06b6d4",
  storage: "#ec4899",
};

export const TIER_STROKE: Record<Criticality, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

/**
 * Returns an SVG path/element generator function for each ServiceType.
 * All shapes are centered at (0,0) with size based on NODE_RADIUS.
 */
export function nodeShapePath(type: ServiceType, r: number = NODE_RADIUS): string {
  switch (type) {
    case "service":
      // Circle — handled via <circle> element, return empty
      return "";
    case "database": {
      // Cylinder shape
      const w = r * 0.8;
      const h = r;
      const ey = r * 0.3;
      return `M ${-w} ${-h + ey} A ${w} ${ey} 0 0 1 ${w} ${-h + ey} L ${w} ${h - ey} A ${w} ${ey} 0 0 1 ${-w} ${h - ey} Z`;
    }
    case "queue":
      // Rounded rectangle
      return "";
    case "cache": {
      // Diamond
      return `M 0 ${-r} L ${r} 0 L 0 ${r} L ${-r} 0 Z`;
    }
    case "external": {
      // Triangle (pointing up)
      const h = r * 1.1;
      const w = r;
      return `M 0 ${-h} L ${w} ${h * 0.6} L ${-w} ${h * 0.6} Z`;
    }
    case "cdn": {
      // Hexagon
      const a = r;
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        pts.push(`${a * Math.cos(angle)} ${a * Math.sin(angle)}`);
      }
      return `M ${pts.join(" L ")} Z`;
    }
    case "storage":
      // Square — handled via <rect>, return empty
      return "";
    default:
      return "";
  }
}

/** Service type labels for display */
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  service: "Service",
  database: "Database",
  queue: "Queue",
  cache: "Cache",
  external: "External",
  cdn: "CDN",
  storage: "Storage",
};

/** All service types */
export const ALL_SERVICE_TYPES: ServiceType[] = [
  "service",
  "database",
  "queue",
  "cache",
  "external",
  "cdn",
  "storage",
];

/** All criticality levels */
export const ALL_CRITICALITIES: Criticality[] = [
  "critical",
  "high",
  "medium",
  "low",
];
