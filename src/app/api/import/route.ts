import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { services, connections, imports } from "@/lib/db/schema";
import { importBodySchema } from "@/lib/api/validation";
import { parseServiceYAML } from "@/lib/yaml/parser";
import {
  apiSuccess,
  badRequest,
  unprocessable,
  internalError,
} from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = importBodySchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(
        "Invalid import request",
        parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
      );
    }

    const { yaml, filename } = parsed.data;

    const parseResult = parseServiceYAML(yaml);

    if (!parseResult.success) {
      return unprocessable("YAML validation failed", parseResult.errors);
    }

    const doc = parseResult.data;
    const importId = randomUUID();
    const now = new Date();

    // Run all DB operations in a single transaction
    const transact = db.transaction((tx) => {
      // Upsert services
      for (const svc of doc.services) {
        tx.insert(services)
          .values({
            id: svc.id,
            name: svc.name,
            description: svc.description ?? null,
            owner: svc.owner ?? null,
            tier: svc.tier ?? "medium",
            type: svc.type ?? "service",
            repository: svc.repository ?? null,
            documentation: svc.documentation ?? null,
            tags: svc.tags ? JSON.stringify(svc.tags) : null,
            metadata: svc.metadata ? JSON.stringify(svc.metadata) : null,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: services.id,
            set: {
              name: svc.name,
              description: svc.description ?? null,
              owner: svc.owner ?? null,
              tier: svc.tier ?? "medium",
              type: svc.type ?? "service",
              repository: svc.repository ?? null,
              documentation: svc.documentation ?? null,
              tags: svc.tags ? JSON.stringify(svc.tags) : null,
              metadata: svc.metadata ? JSON.stringify(svc.metadata) : null,
              updatedAt: now,
            },
          })
          .run();
      }

      // Upsert connections
      for (const conn of doc.connections) {
        // Look up existing connection by source+target to reuse UUID
        const existing = tx
          .select()
          .from(connections)
          .where(
            and(
              eq(connections.sourceId, conn.source),
              eq(connections.targetId, conn.target)
            )
          )
          .get();

        const connId = existing?.id ?? randomUUID();

        tx.insert(connections)
          .values({
            id: connId,
            sourceId: conn.source,
            targetId: conn.target,
            label: conn.label ?? null,
            protocol: conn.protocol ?? "https",
            port: conn.port ?? null,
            description: conn.description ?? null,
            criticality: conn.criticality ?? "medium",
            slaTargetMs: conn.sla_target_ms ?? null,
            slaUptimePercent: conn.sla_uptime_percent ?? null,
            authMethod: conn.auth_method ?? null,
            isAsync: conn.is_async ?? false,
            metadata: conn.metadata ? JSON.stringify(conn.metadata) : null,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: connections.id,
            set: {
              label: conn.label ?? null,
              protocol: conn.protocol ?? "https",
              port: conn.port ?? null,
              description: conn.description ?? null,
              criticality: conn.criticality ?? "medium",
              slaTargetMs: conn.sla_target_ms ?? null,
              slaUptimePercent: conn.sla_uptime_percent ?? null,
              authMethod: conn.auth_method ?? null,
              isAsync: conn.is_async ?? false,
              metadata: conn.metadata ? JSON.stringify(conn.metadata) : null,
              updatedAt: now,
            },
          })
          .run();
      }

      // Record import
      tx.insert(imports)
        .values({
          id: importId,
          filename: filename ?? "untitled.yaml",
          importedAt: now,
          servicesCount: doc.services.length,
          connectionsCount: doc.connections.length,
          status: "success",
        })
        .run();
    });

    transact;

    return apiSuccess(
      {
        importId,
        servicesCount: doc.services.length,
        connectionsCount: doc.connections.length,
        status: "success",
      },
      201
    );
  } catch (err) {
    return internalError(err);
  }
}
