import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">Topologr</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Document your service architecture in YAML. Visualize dependencies,
          SLAs, and criticality in an interactive graph.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/graph"
            className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Open Graph
          </Link>
          <Link
            href="/import"
            className="rounded-md border border-input px-6 py-3 text-sm font-medium hover:bg-accent"
          >
            Import YAML
          </Link>
        </div>
      </div>
    </main>
  );
}
