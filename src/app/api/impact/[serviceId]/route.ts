import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { services, connections } from "@/lib/db/schema";
import { analyzeImpact } from "@/lib/graph/impact";
import { apiSuccess, notFound, internalError } from "@/lib/api/errors";
import type { GraphEdge, Criticality, Protocol, AuthMethod } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const { serviceId } = await params;

    const service = db
      .select()
      .from(services)
      .where(eq(services.id, serviceId))
      .get();

    if (!service) {
      return notFound("Service", serviceId);
    }

    const allConnections = db.select().from(connections).all();

    const edges: GraphEdge[] = allConnections.map((c) => ({
      id: c.id,
      source: c.sourceId,
      target: c.targetId,
      label: c.label ?? undefined,
      protocol: (c.protocol as Protocol) ?? undefined,
      port: c.port ?? undefined,
      criticality: (c.criticality as Criticality) ?? "medium",
      slaTargetMs: c.slaTargetMs ?? undefined,
      slaUptimePercent: c.slaUptimePercent ?? undefined,
      authMethod: (c.authMethod as AuthMethod) ?? undefined,
      isAsync: c.isAsync,
    }));

    const result = analyzeImpact(serviceId, edges);

    return apiSuccess(result);
  } catch (err) {
    return internalError(err);
  }
}
