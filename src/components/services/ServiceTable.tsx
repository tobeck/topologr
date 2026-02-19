import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { NODE_COLORS, CRITICALITY_COLORS, SERVICE_TYPE_LABELS } from "@/components/graph/graph-constants";
import type { ApiService } from "./use-services";

const MAX_VISIBLE_TAGS = 3;

interface ServiceTableProps {
  services: ApiService[];
  onSelectService?: (service: ApiService) => void;
}

export function ServiceTable({ services, onSelectService }: ServiceTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow
              key={service.id}
              className={onSelectService ? "cursor-pointer hover:bg-muted/50" : undefined}
              onClick={() => onSelectService?.(service)}
            >
              <TableCell className="font-medium">{service.name}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  style={{
                    borderColor: NODE_COLORS[service.type],
                    color: NODE_COLORS[service.type],
                  }}
                >
                  {SERVICE_TYPE_LABELS[service.type]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  style={{
                    borderColor: CRITICALITY_COLORS[service.tier],
                    color: CRITICALITY_COLORS[service.tier],
                  }}
                >
                  {service.tier}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {service.owner ?? "—"}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {service.tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {service.tags.length > MAX_VISIBLE_TAGS && (
                    <Badge variant="secondary" className="text-xs">
                      +{service.tags.length - MAX_VISIBLE_TAGS}
                    </Badge>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
