import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { connections, services } from "@/lib/db/schema";
import { createConnectionSchema } from "@/lib/api/validation";
import {
  apiSuccess,
  badRequest,
  internalError,
} from "@/lib/api/errors";

function deserializeConnection(row: typeof connections.$inferSelect) {
  return {
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sourceId = url.searchParams.get("sourceId");
    const targetId = url.searchParams.get("targetId");
    const protocol = url.searchParams.get("protocol");
    const criticality = url.searchParams.get("criticality");

    const conditions = [];
    if (sourceId) conditions.push(eq(connections.sourceId, sourceId));
    if (targetId) conditions.push(eq(connections.targetId, targetId));
    if (protocol) conditions.push(eq(connections.protocol, protocol as "http" | "https" | "grpc" | "tcp" | "udp" | "amqp" | "redis" | "postgres" | "mysql" | "custom"));
    if (criticality) conditions.push(eq(connections.criticality, criticality as "critical" | "high" | "medium" | "low"));

    const rows =
      conditions.length > 0
        ? db.select().from(connections).where(and(...conditions)).all()
        : db.select().from(connections).all();

    return apiSuccess(rows.map(deserializeConnection));
  } catch (err) {
    return internalError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createConnectionSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(
        "Invalid connection data",
        parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
      );
    }

    const data = parsed.data;

    if (data.sourceId === data.targetId) {
      return badRequest("A service cannot connect to itself");
    }

    const source = db
      .select()
      .from(services)
      .where(eq(services.id, data.sourceId))
      .get();
    if (!source) {
      return badRequest(`Source service '${data.sourceId}' does not exist`);
    }

    const target = db
      .select()
      .from(services)
      .where(eq(services.id, data.targetId))
      .get();
    if (!target) {
      return badRequest(`Target service '${data.targetId}' does not exist`);
    }

    const id = randomUUID();
    const now = new Date();

    db.insert(connections)
      .values({
        id,
        sourceId: data.sourceId,
        targetId: data.targetId,
        label: data.label ?? null,
        protocol: data.protocol,
        port: data.port ?? null,
        description: data.description ?? null,
        criticality: data.criticality,
        slaTargetMs: data.slaTargetMs ?? null,
        slaUptimePercent: data.slaUptimePercent ?? null,
        authMethod: data.authMethod ?? null,
        isAsync: data.isAsync,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const created = db
      .select()
      .from(connections)
      .where(eq(connections.id, id))
      .get()!;

    return apiSuccess(deserializeConnection(created), 201);
  } catch (err) {
    return internalError(err);
  }
}
