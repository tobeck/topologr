"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Network, Server, Upload, Download } from "lucide-react";

const NAV_ITEMS = [
  { href: "/graph", label: "Graph", icon: Network },
  { href: "/services", label: "Services", icon: Server },
  { href: "/import", label: "Import", icon: Upload },
] as const;

const EXAMPLE_FILES = [
  { filename: "web-app-stack.yaml", label: "Web App Stack" },
  { filename: "microservices-platform.yaml", label: "Microservices Platform" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-muted/40">
      <div className="border-b px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          ServiceMap
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-4 py-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Example YAML
        </p>
        <div className="space-y-1">
          {EXAMPLE_FILES.map(({ filename, label }) => (
            <a
              key={filename}
              href={`/api/examples/${filename}`}
              download
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground"
            >
              <Download className="h-3.5 w-3.5" />
              {label}
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
