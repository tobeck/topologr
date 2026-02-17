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

const serviceId = z
  .string()
  .min(1)
  .max(64)
  .regex(
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
    "Must be lowercase alphanumeric with hyphens, e.g. 'auth-service'"
  );

export const createServiceSchema = z.object({
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

export const updateServiceSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(1024).optional().nullable(),
  owner: z.string().max(128).optional().nullable(),
  tier: criticality.optional(),
  type: serviceType.optional(),
  repository: z.string().url().optional().nullable(),
  documentation: z.string().url().optional().nullable(),
  tags: z.array(z.string().max(64)).max(20).optional(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export const createConnectionSchema = z.object({
  sourceId: serviceId,
  targetId: serviceId,
  label: z.string().max(128).optional(),
  protocol: protocol.default("https"),
  port: z.number().int().min(1).max(65535).optional(),
  description: z.string().max(1024).optional(),
  criticality: criticality.default("medium"),
  slaTargetMs: z.number().positive().optional(),
  slaUptimePercent: z.number().min(0).max(100).optional(),
  authMethod: authMethod.optional(),
  isAsync: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional(),
});

export const updateConnectionSchema = z.object({
  label: z.string().max(128).optional().nullable(),
  protocol: protocol.optional(),
  port: z.number().int().min(1).max(65535).optional().nullable(),
  description: z.string().max(1024).optional().nullable(),
  criticality: criticality.optional(),
  slaTargetMs: z.number().positive().optional().nullable(),
  slaUptimePercent: z.number().min(0).max(100).optional().nullable(),
  authMethod: authMethod.optional().nullable(),
  isAsync: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export const importBodySchema = z.object({
  yaml: z.string().min(1, "YAML content is required"),
  filename: z.string().max(256).optional(),
});
