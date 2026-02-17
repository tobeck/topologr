"use client";

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ImportSuccessData {
  importId: string;
  servicesCount: number;
  connectionsCount: number;
  status: string;
}

interface ImportResultProps {
  result: {
    success: boolean;
    data?: ImportSuccessData;
    errors?: string[];
  };
}

export function ImportResult({ result }: ImportResultProps) {
  if (result.success && result.data) {
    return (
      <Alert className="border-green-500/50 bg-green-500/5">
        <AlertTitle className="text-green-700 dark:text-green-400">
          Import successful
        </AlertTitle>
        <AlertDescription>
          <p className="text-sm mt-1">
            Imported {result.data.servicesCount} services and{" "}
            {result.data.connectionsCount} connections.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/graph">View Graph</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTitle>Import failed</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-4 mt-1 space-y-1 text-sm">
          {result.errors?.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
