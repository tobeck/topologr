import { NextResponse } from "next/server";

export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json(
    { error: message, ...(details !== undefined ? { details } : {}) },
    { status: 400 }
  );
}

export function notFound(entity: string, id: string) {
  return NextResponse.json(
    { error: `${entity} '${id}' not found` },
    { status: 404 }
  );
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function unprocessable(message: string, details?: unknown) {
  return NextResponse.json(
    { error: message, ...(details !== undefined ? { details } : {}) },
    { status: 422 }
  );
}

export function internalError(err: unknown) {
  const message =
    err instanceof Error ? err.message : "Internal server error";
  console.error("[API Error]", err);
  return NextResponse.json({ error: message }, { status: 500 });
}
