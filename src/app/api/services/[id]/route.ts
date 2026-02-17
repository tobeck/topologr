import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { updateServiceSchema } from "@/lib/api/validation";
import {
  apiSuccess,
  badRequest,
  notFound,
  internalError,
} from "@/lib/api/errors";

function deserializeService(row: typeof services.$inferSelect) {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = db.select().from(services).where(eq(services.id, id)).get();

    if (!row) {
      return notFound("Service", id);
    }

    return apiSuccess(deserializeService(row));
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
    const parsed = updateServiceSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(
        "Invalid service data",
        parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
      );
    }

    const data = parsed.data;

    const updateValues: Record<string, unknown> = { updatedAt: new Date() };

    if (data.name !== undefined) updateValues.name = data.name;
    if (data.description !== undefined) updateValues.description = data.description;
    if (data.owner !== undefined) updateValues.owner = data.owner;
    if (data.tier !== undefined) updateValues.tier = data.tier;
    if (data.type !== undefined) updateValues.type = data.type;
    if (data.repository !== undefined) updateValues.repository = data.repository;
    if (data.documentation !== undefined) updateValues.documentation = data.documentation;
    if (data.tags !== undefined) updateValues.tags = JSON.stringify(data.tags);
    if (data.metadata !== undefined)
      updateValues.metadata =
        data.metadata === null ? null : JSON.stringify(data.metadata);

    const result = db
      .update(services)
      .set(updateValues)
      .where(eq(services.id, id))
      .run();

    if (result.changes === 0) {
      return notFound("Service", id);
    }

    const updated = db.select().from(services).where(eq(services.id, id)).get()!;
    return apiSuccess(deserializeService(updated));
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
    const result = db.delete(services).where(eq(services.id, id)).run();

    if (result.changes === 0) {
      return notFound("Service", id);
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    return internalError(err);
  }
}
