import { z } from "zod";

const criticality = z.enum(["critical", "high", "medium", "low"]);

const serviceType = z.enum([
  "service",
  "database",
  "queue",
  "cache",
  "external",
  "cdn",
  "storage",
]);

const protocol = z.enum([
  "http",
  "https",
  "grpc",
  "tcp",
  "udp",
  "amqp",
  "redis",
  "postgres",
  "mysql",
  "custom",
]);

const authMethod = z.enum([
  "none",
  "api_key",
  "oauth2",
  "mtls",
  "jwt",
  "basic",
  "custom",
]);

// Slug format: lowercase alphanumeric + hyphens, 1-64 chars
const serviceId = z
  .string()
  .min(1)
  .max(64)
  .regex(
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
    "Service ID must be lowercase alphanumeric with hyphens, e.g. 'auth-service'"
  );

export const serviceSchema = z.object({
  id: serviceId,
  name: z.string().min(1).max(128),
  description: z.string().max(1024).optional(),
  owner: z.string().max(128).optional(),
  tier: criticality.default("medium"),
  type: serviceType.default("service"),
  repository: z.string().url().optional(),
  documentation: z.string().url().optional(),
  tags: z.array(z.string().max(64)).max(20).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const connectionSchema = z.object({
  source: serviceId,
  target: serviceId,
  label: z.string().max(128).optional(),
  protocol: protocol.default("https"),
  port: z.number().int().min(1).max(65535).optional(),
  description: z.string().max(1024).optional(),
  criticality: criticality.default("medium"),
  sla_target_ms: z.number().positive().optional(),
  sla_uptime_percent: z.number().min(0).max(100).optional(),
  auth_method: authMethod.optional(),
  is_async: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional(),
});

export const yamlDocumentSchema = z
  .object({
    services: z.array(serviceSchema).min(1, "At least one service is required"),
    connections: z.array(connectionSchema).default([]),
  })
  .refine(
    (doc) => {
      // Check for duplicate service IDs
      const ids = doc.services.map((s) => s.id);
      return new Set(ids).size === ids.length;
    },
    { message: "Duplicate service IDs found" }
  )
  .refine(
    (doc) => {
      // Check that all connection source/target reference existing services
      const ids = new Set(doc.services.map((s) => s.id));
      return doc.connections.every(
        (c) => ids.has(c.source) && ids.has(c.target)
      );
    },
    {
      message:
        "Connection references a service ID that is not defined in the services list",
    }
  )
  .refine(
    (doc) => {
      // No self-loops
      return doc.connections.every((c) => c.source !== c.target);
    },
    { message: "A service cannot connect to itself" }
  );

export type ValidatedYAMLDocument = z.infer<typeof yamlDocumentSchema>;
export type ValidatedService = z.infer<typeof serviceSchema>;
export type ValidatedConnection = z.infer<typeof connectionSchema>;
