import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { services, connections, imports } from "@/lib/db/schema";

// ============================================================
// DB row types (inferred from Drizzle schema)
// ============================================================
export type Service = InferSelectModel<typeof services>;
export type NewService = InferInsertModel<typeof services>;

export type Connection = InferSelectModel<typeof connections>;
export type NewConnection = InferInsertModel<typeof connections>;

export type Import = InferSelectModel<typeof imports>;
export type NewImport = InferInsertModel<typeof imports>;

// ============================================================
// Enums (keep in sync with schema)
// ============================================================
export type Criticality = "critical" | "high" | "medium" | "low";

export type ServiceType =
  | "service"
  | "database"
  | "queue"
  | "cache"
  | "external"
  | "cdn"
  | "storage";

export type Protocol =
  | "http"
  | "https"
  | "grpc"
  | "tcp"
  | "udp"
  | "amqp"
  | "redis"
  | "postgres"
  | "mysql"
  | "custom";

export type AuthMethod =
  | "none"
  | "api_key"
  | "oauth2"
  | "mtls"
  | "jwt"
  | "basic"
  | "custom";

// ============================================================
// Graph types (used by visualization and analysis)
// ============================================================
export interface GraphNode {
  id: string;
  name: string;
  type: ServiceType;
  tier: Criticality;
  owner?: string;
  repository?: string;
  documentation?: string;
  description?: string;
  tags: string[];
  // D3 force simulation fields (mutable)
  x?: number;
  y?: number;
  fx?: number | null; // fixed x (when dragged)
  fy?: number | null; // fixed y (when dragged)
}

export interface GraphEdge {
  id: string;
  source: string; // service id
  target: string; // service id
  label?: string;
  protocol?: Protocol;
  port?: number;
  criticality: Criticality;
  slaTargetMs?: number;
  slaUptimePercent?: number;
  authMethod?: AuthMethod;
  isAsync: boolean;
}

export interface ServiceGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ============================================================
// YAML import types
// ============================================================
export interface YAMLServiceDefinition {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  tier?: Criticality;
  type?: ServiceType;
  repository?: string;
  documentation?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface YAMLConnectionDefinition {
  source: string;
  target: string;
  label?: string;
  protocol?: Protocol;
  port?: number;
  description?: string;
  criticality?: Criticality;
  sla_target_ms?: number;
  sla_uptime_percent?: number;
  auth_method?: AuthMethod;
  is_async?: boolean;
  metadata?: Record<string, unknown>;
}

export interface YAMLDocument {
  services: YAMLServiceDefinition[];
  connections: YAMLConnectionDefinition[];
}

// ============================================================
// Impact analysis types
// ============================================================
export interface ImpactResult {
  /** The service that was analyzed */
  sourceId: string;
  /** Services directly affected (1 hop) */
  directDependents: string[];
  /** All services affected transitively */
  allAffected: string[];
  /** Adjacency map: serviceId → list of services it impacts */
  impactChain: Record<string, string[]>;
  /** Highest criticality among affected connections */
  maxCriticality: Criticality;
}
