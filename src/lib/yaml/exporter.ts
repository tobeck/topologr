import YAML from "yaml";
import { db } from "@/lib/db";
import { services, connections } from "@/lib/db/schema";

interface ExportService {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  tier?: string;
  type?: string;
  repository?: string;
  documentation?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface ExportConnection {
  source: string;
  target: string;
  label?: string;
  protocol?: string;
  port?: number;
  description?: string;
  criticality?: string;
  sla_target_ms?: number;
  sla_uptime_percent?: number;
  auth_method?: string;
  is_async?: boolean;
  metadata?: Record<string, unknown>;
}

interface ExportDocument {
  services: ExportService[];
  connections: ExportConnection[];
}

const SERVICE_DEFAULTS = {
  tier: "medium",
  type: "service",
} as const;

const CONNECTION_DEFAULTS = {
  protocol: "https",
  criticality: "medium",
  is_async: false,
} as const;

/**
 * Build the export document from DB rows, omitting default and null values.
 */
export function buildExportDocument(
  serviceRows: (typeof services.$inferSelect)[],
  connectionRows: (typeof connections.$inferSelect)[],
): ExportDocument {
  const exportServices: ExportService[] = serviceRows.map((row) => {
    const svc: ExportService = { id: row.id, name: row.name };

    if (row.description) svc.description = row.description;
    if (row.owner) svc.owner = row.owner;
    if (row.tier && row.tier !== SERVICE_DEFAULTS.tier) svc.tier = row.tier;
    if (row.type && row.type !== SERVICE_DEFAULTS.type) svc.type = row.type;
    if (row.repository) svc.repository = row.repository;
    if (row.documentation) svc.documentation = row.documentation;
    if (row.tags) {
      const parsed = JSON.parse(row.tags) as string[];
      if (parsed.length > 0) svc.tags = parsed;
    }
    if (row.metadata) {
      const parsed = JSON.parse(row.metadata) as Record<string, unknown>;
      if (Object.keys(parsed).length > 0) svc.metadata = parsed;
    }

    return svc;
  });

  const exportConnections: ExportConnection[] = connectionRows.map((row) => {
    const conn: ExportConnection = {
      source: row.sourceId,
      target: row.targetId,
    };

    if (row.label) conn.label = row.label;
    if (row.protocol && row.protocol !== CONNECTION_DEFAULTS.protocol)
      conn.protocol = row.protocol;
    if (row.port) conn.port = row.port;
    if (row.description) conn.description = row.description;
    if (row.criticality && row.criticality !== CONNECTION_DEFAULTS.criticality)
      conn.criticality = row.criticality;
    if (row.slaTargetMs != null) conn.sla_target_ms = row.slaTargetMs;
    if (row.slaUptimePercent != null)
      conn.sla_uptime_percent = row.slaUptimePercent;
    if (row.authMethod) conn.auth_method = row.authMethod;
    if (row.isAsync !== CONNECTION_DEFAULTS.is_async)
      conn.is_async = row.isAsync;
    if (row.metadata) {
      const parsed = JSON.parse(row.metadata) as Record<string, unknown>;
      if (Object.keys(parsed).length > 0) conn.metadata = parsed;
    }

    return conn;
  });

  return { services: exportServices, connections: exportConnections };
}

/**
 * Export all services and connections from the database as a YAML string.
 */
export function exportServicesToYAML(): string {
  const serviceRows = db.select().from(services).all();
  const connectionRows = db.select().from(connections).all();

  const doc = buildExportDocument(serviceRows, connectionRows);

  return YAML.stringify(doc, {
    lineWidth: 0, // no wrapping
    defaultKeyType: "PLAIN",
    defaultStringType: "PLAIN",
  });
}

/**
 * Export all services and connections from the database as a JSON-compatible object.
 */
export function exportServicesToJSON(): ExportDocument {
  const serviceRows = db.select().from(services).all();
  const connectionRows = db.select().from(connections).all();

  return buildExportDocument(serviceRows, connectionRows);
}
