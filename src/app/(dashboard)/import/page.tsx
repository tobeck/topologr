"use client";

import { useState } from "react";
import { FileDropzone } from "@/components/import/FileDropzone";
import { YamlEditor } from "@/components/import/YamlEditor";
import { ImportResult } from "@/components/import/ImportResult";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const EXAMPLE_YAML = `# Example: Web Application Stack
services:
  - id: web-frontend
    name: Web Frontend
    type: service
    tier: critical
    owner: frontend-team
    tags: [react, user-facing]
    description: Customer-facing React SPA

  - id: api-gateway
    name: API Gateway
    type: service
    tier: critical
    owner: platform-team
    tags: [gateway, nginx]
    description: Reverse proxy and rate limiter

  - id: auth-service
    name: Auth Service
    type: service
    tier: critical
    owner: platform-team
    description: Handles authentication and JWT token issuance

  - id: user-service
    name: User Service
    type: service
    tier: high
    owner: backend-team

  - id: order-service
    name: Order Service
    type: service
    tier: high
    owner: backend-team

  - id: postgres-primary
    name: PostgreSQL Primary
    type: database
    tier: critical
    owner: dba-team

  - id: redis-cache
    name: Redis Cache
    type: cache
    tier: high
    owner: platform-team

  - id: rabbitmq
    name: RabbitMQ
    type: queue
    tier: high
    owner: platform-team

connections:
  - source: web-frontend
    target: api-gateway
    protocol: https
    port: 443
    criticality: critical

  - source: api-gateway
    target: auth-service
    protocol: http
    port: 8080
    criticality: critical

  - source: api-gateway
    target: user-service
    protocol: http
    port: 8081
    criticality: high

  - source: api-gateway
    target: order-service
    protocol: http
    port: 8082
    criticality: high

  - source: auth-service
    target: postgres-primary
    protocol: postgres
    port: 5432
    criticality: critical

  - source: auth-service
    target: redis-cache
    protocol: redis
    port: 6379
    criticality: high

  - source: user-service
    target: postgres-primary
    protocol: postgres
    port: 5432
    criticality: high

  - source: order-service
    target: postgres-primary
    protocol: postgres
    port: 5432
    criticality: high

  - source: order-service
    target: rabbitmq
    protocol: amqp
    port: 5672
    criticality: medium
    is_async: true
`;

interface ImportResponse {
  success: boolean;
  data?: {
    importId: string;
    servicesCount: number;
    connectionsCount: number;
    status: string;
  };
  errors?: string[];
}

export default function ImportPage() {
  const [yaml, setYaml] = useState("");
  const [filename, setFilename] = useState<string | undefined>();
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);

  const handleFileLoad = (content: string, name: string) => {
    setYaml(content);
    setFilename(name);
    setResult(null);
  };

  const handleImport = async () => {
    if (!yaml.trim()) return;

    setIsImporting(true);
    setResult(null);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml, filename }),
      });

      const body = await res.json();

      if (res.ok) {
        setResult({ success: true, data: body });
      } else {
        const errors = Array.isArray(body.details)
          ? body.details
          : [body.error ?? "Import failed"];
        setResult({ success: false, errors });
      }
    } catch {
      setResult({ success: false, errors: ["Network error — is the server running?"] });
    } finally {
      setIsImporting(false);
    }
  };

  const handleLoadExample = () => {
    setYaml(EXAMPLE_YAML);
    setFilename("web-app-stack.yaml");
    setResult(null);
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Import Services
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a YAML file or paste a service definition to import.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Service Definition</CardTitle>
            <CardDescription>
              Drop a <code>.yaml</code> file, paste content below, or{" "}
              <button
                type="button"
                onClick={handleLoadExample}
                disabled={isImporting}
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                load an example
              </button>
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileDropzone onFileLoad={handleFileLoad} disabled={isImporting} />

            <YamlEditor
              value={yaml}
              onChange={(v) => {
                setYaml(v);
                setResult(null);
              }}
              disabled={isImporting}
            />

            <Button
              onClick={handleImport}
              disabled={isImporting || !yaml.trim()}
              className="w-full"
            >
              {isImporting ? "Importing..." : "Import"}
            </Button>

            {result && <ImportResult result={result} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
