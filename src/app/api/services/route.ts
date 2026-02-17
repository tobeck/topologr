import { NextRequest } from "next/server";
import { eq, and, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { createServiceSchema } from "@/lib/api/validation";
import {
  apiSuccess,
  badRequest,
  conflict,
  internalError,
} from "@/lib/api/errors";

function deserializeService(row: typeof services.$inferSelect) {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const owner = url.searchParams.get("owner");
    const tier = url.searchParams.get("tier");
    const type = url.searchParams.get("type");
    const tag = url.searchParams.get("tag");

    const conditions = [];
    if (owner) conditions.push(eq(services.owner, owner));
    if (tier) conditions.push(eq(services.tier, tier as "critical" | "high" | "medium" | "low"));
    if (type) conditions.push(eq(services.type, type as "service" | "database" | "queue" | "cache" | "external" | "cdn" | "storage"));
    if (tag) conditions.push(like(services.tags, `%"${tag}"%`));

    const rows =
      conditions.length > 0
        ? db.select().from(services).where(and(...conditions)).all()
        : db.select().from(services).all();

    return apiSuccess(rows.map(deserializeService));
  } catch (err) {
    return internalError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createServiceSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(
        "Invalid service data",
        parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
      );
    }

    const data = parsed.data;

    const existing = db
      .select()
      .from(services)
      .where(eq(services.id, data.id))
      .get();

    if (existing) {
      return conflict(`Service '${data.id}' already exists`);
    }

    const now = new Date();
    db.insert(services)
      .values({
        id: data.id,
        name: data.name,
        description: data.description ?? null,
        owner: data.owner ?? null,
        tier: data.tier,
        type: data.type,
        repository: data.repository ?? null,
        documentation: data.documentation ?? null,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const created = db
      .select()
      .from(services)
      .where(eq(services.id, data.id))
      .get()!;

    return apiSuccess(deserializeService(created), 201);
  } catch (err) {
    return internalError(err);
  }
}
