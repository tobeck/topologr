import { NextRequest, NextResponse } from "next/server";
import { exportServicesToYAML, exportServicesToJSON } from "@/lib/yaml/exporter";
import { internalError } from "@/lib/api/errors";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get("format");

    if (format === "json") {
      const data = exportServicesToJSON();
      return NextResponse.json(data);
    }

    const yaml = exportServicesToYAML();
    return new NextResponse(yaml, {
      status: 200,
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Content-Disposition": 'attachment; filename="topologr-export.yaml"',
      },
    });
  } catch (err) {
    return internalError(err);
  }
}
