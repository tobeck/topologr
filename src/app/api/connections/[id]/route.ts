import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema";
import { updateConnectionSchema } from "@/lib/api/validation";
import {
  apiSuccess,
  badRequest,
  notFound,
  internalError,
} from "@/lib/api/errors";

function deserializeConnection(row: typeof connections.$inferSelect) {
  return {
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = db
      .select()
      .from(connections)
      .where(eq(connections.id, id))
      .get();

    if (!row) {
      return notFound("Connection", id);
    }

    return apiSuccess(deserializeConnection(row));
  } catch (err) {
    return internalError(err);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateConnectionSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(
        "Invalid connection data",
        parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
      );
    }

    const data = parsed.data;

    const updateValues: Record<string, unknown> = { updatedAt: new Date() };

    if (data.label !== undefined) updateValues.label = data.label;
    if (data.protocol !== undefined) updateValues.protocol = data.protocol;
    if (data.port !== undefined) updateValues.port = data.port;
    if (data.description !== undefined) updateValues.description = data.description;
    if (data.criticality !== undefined) updateValues.criticality = data.criticality;
    if (data.slaTargetMs !== undefined) updateValues.slaTargetMs = data.slaTargetMs;
    if (data.slaUptimePercent !== undefined) updateValues.slaUptimePercent = data.slaUptimePercent;
    if (data.authMethod !== undefined) updateValues.authMethod = data.authMethod;
    if (data.isAsync !== undefined) updateValues.isAsync = data.isAsync;
    if (data.metadata !== undefined)
      updateValues.metadata =
        data.metadata === null ? null : JSON.stringify(data.metadata);

    const result = db
      .update(connections)
      .set(updateValues)
      .where(eq(connections.id, id))
      .run();

    if (result.changes === 0) {
      return notFound("Connection", id);
    }

    const updated = db
      .select()
      .from(connections)
      .where(eq(connections.id, id))
      .get()!;

    return apiSuccess(deserializeConnection(updated));
  } catch (err) {
    return internalError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = db.delete(connections).where(eq(connections.id, id)).run();

    if (result.changes === 0) {
      return notFound("Connection", id);
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    return internalError(err);
  }
}
