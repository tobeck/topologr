"use client";

import { ZoomIn, ZoomOut, Maximize2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  isImpactMode: boolean;
  onToggleImpactMode: () => void;
}

export function GraphControls({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  isImpactMode,
  onToggleImpactMode,
}: GraphControlsProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom in</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom out</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onResetZoom}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Reset view</TooltipContent>
        </Tooltip>

        <div className="h-px bg-border my-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isImpactMode ? "default" : "outline"}
              size="icon"
              onClick={onToggleImpactMode}
            >
              <Target className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {isImpactMode ? "Exit impact mode" : "Impact analysis mode"}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
