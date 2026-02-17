import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ============================================================
// Services — nodes in the dependency graph
// ============================================================
export const services = sqliteTable("services", {
  id: text("id").primaryKey(), // slug, e.g. "auth-service"
  name: text("name").notNull(), // display name, e.g. "Auth Service"
  description: text("description"),
  owner: text("owner"), // team or person, e.g. "platform-team"
  tier: text("tier", {
    enum: ["critical", "high", "medium", "low"],
  })
    .notNull()
    .default("medium"),
  type: text("type", {
    enum: ["service", "database", "queue", "cache", "external", "cdn", "storage"],
  })
    .notNull()
    .default("service"),
  repository: text("repository"), // git URL
  documentation: text("documentation"), // docs URL
  tags: text("tags"), // JSON array of strings, e.g. '["auth","core"]'
  metadata: text("metadata"), // arbitrary JSON for extensibility
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ============================================================
// Connections — directed edges between services
// ============================================================
export const connections = sqliteTable("connections", {
  id: text("id").primaryKey(), // auto-generated UUID
  sourceId: text("source_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  targetId: text("target_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  label: text("label"), // e.g. "REST API", "gRPC", "TCP"
  protocol: text("protocol", {
    enum: ["http", "https", "grpc", "tcp", "udp", "amqp", "redis", "postgres", "mysql", "custom"],
  }).default("https"),
  port: integer("port"),
  description: text("description"),
  criticality: text("criticality", {
    enum: ["critical", "high", "medium", "low"],
  })
    .notNull()
    .default("medium"),
  // SLA fields
  slaTargetMs: real("sla_target_ms"), // target latency in ms
  slaUptimePercent: real("sla_uptime_percent"), // e.g. 99.95
  // Auth between services
  authMethod: text("auth_method", {
    enum: ["none", "api_key", "oauth2", "mtls", "jwt", "basic", "custom"],
  }),
  isAsync: integer("is_async", { mode: "boolean" }).notNull().default(false),
  metadata: text("metadata"), // arbitrary JSON
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ============================================================
// Import history — track YAML imports
// ============================================================
export const imports = sqliteTable("imports", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  importedAt: integer("imported_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  servicesCount: integer("services_count").notNull().default(0),
  connectionsCount: integer("connections_count").notNull().default(0),
  status: text("status", {
    enum: ["success", "partial", "failed"],
  })
    .notNull()
    .default("success"),
  errors: text("errors"), // JSON array of error messages
});
