"use client";

import {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
  type MutableRefObject,
} from "react";
import * as d3 from "d3";
import type { GraphNode, GraphEdge, ServiceGraph, ImpactResult } from "@/types";
import {
  NODE_RADIUS,
  NODE_COLORS,
  CRITICALITY_COLORS,
  EDGE_WIDTH,
  TIER_STROKE,
  nodeShapePath,
  IMPACT_DIM_OPACITY,
  getHopColor,
} from "./graph-constants";

export interface ServiceGraphHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

interface ServiceGraphProps {
  graph: ServiceGraph;
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  impactResult?: ImpactResult | null;
}

type SimNode = GraphNode & d3.SimulationNodeDatum;
type SimEdge = Omit<GraphEdge, "source" | "target"> & {
  source: SimNode | string;
  target: SimNode | string;
};

const ServiceGraphComponent = forwardRef<ServiceGraphHandle, ServiceGraphProps>(
  function ServiceGraphComponent({ graph, onNodeClick, onEdgeClick, impactResult }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>(null);

    // Store callbacks in refs so graph doesn't re-render when they change
    const onNodeClickRef = useRef(onNodeClick) as MutableRefObject<typeof onNodeClick>;
    const onEdgeClickRef = useRef(onEdgeClick) as MutableRefObject<typeof onEdgeClick>;
    onNodeClickRef.current = onNodeClick;
    onEdgeClickRef.current = onEdgeClick;

    useImperativeHandle(ref, () => ({
      zoomIn() {
        if (svgRef.current && zoomRef.current) {
          d3.select(svgRef.current)
            .transition()
            .duration(300)
            .call(zoomRef.current.scaleBy, 1.3);
        }
      },
      zoomOut() {
        if (svgRef.current && zoomRef.current) {
          d3.select(svgRef.current)
            .transition()
            .duration(300)
            .call(zoomRef.current.scaleBy, 0.7);
        }
      },
      resetZoom() {
        if (svgRef.current && zoomRef.current) {
          d3.select(svgRef.current)
            .transition()
            .duration(500)
            .call(
              zoomRef.current.transform,
              d3.zoomIdentity
            );
        }
      },
    }));

    const renderGraph = useCallback(() => {
      if (!svgRef.current || !containerRef.current) return;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      svg.attr("width", width).attr("height", height);

      // Arrow marker definitions
      const defs = svg.append("defs");

      // Red glow filter for impact source node
      const glowFilter = defs.append("filter")
        .attr("id", "impact-glow")
        .attr("x", "-50%").attr("y", "-50%")
        .attr("width", "200%").attr("height", "200%");
      glowFilter.append("feGaussianBlur")
        .attr("in", "SourceGraphic")
        .attr("stdDeviation", "4")
        .attr("result", "blur");
      glowFilter.append("feFlood")
        .attr("flood-color", "#ef4444")
        .attr("flood-opacity", "0.6")
        .attr("result", "color");
      glowFilter.append("feComposite")
        .attr("in", "color")
        .attr("in2", "blur")
        .attr("operator", "in")
        .attr("result", "glow");
      const glowMerge = glowFilter.append("feMerge");
      glowMerge.append("feMergeNode").attr("in", "glow");
      glowMerge.append("feMergeNode").attr("in", "SourceGraphic");

      // One marker per criticality color
      (["critical", "high", "medium", "low"] as const).forEach((crit) => {
        defs
          .append("marker")
          .attr("id", `arrow-${crit}`)
          .attr("viewBox", "0 -3 6 6")
          .attr("refX", NODE_RADIUS + 8)
          .attr("refY", 0)
          .attr("markerWidth", 5)
          .attr("markerHeight", 5)
          .attr("orient", "auto")
          .append("path")
          .attr("d", "M0,-3L6,0L0,3")
          .attr("fill", CRITICALITY_COLORS[crit]);
      });

      // Zoom behavior
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });

      svg.call(zoom);
      zoomRef.current = zoom;

      const g = svg.append("g");

      // Deep clone nodes/edges for simulation
      const nodes: SimNode[] = graph.nodes.map((n) => ({ ...n }));
      const edges: SimEdge[] = graph.edges.map((e) => ({ ...e }));

      // Force simulation
      const simulation = d3
        .forceSimulation<SimNode>(nodes)
        .force(
          "link",
          d3
            .forceLink<SimNode, SimEdge>(edges)
            .id((d) => d.id)
            .distance(150)
        )
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide(NODE_RADIUS * 2));

      // Draw edges
      const edgeGroup = g.append("g").attr("class", "edges");
      const edgeElements = edgeGroup
        .selectAll("line")
        .data(edges)
        .join("line")
        .attr("stroke", (d) => CRITICALITY_COLORS[d.criticality])
        .attr("stroke-width", (d) => EDGE_WIDTH[d.criticality])
        .attr("stroke-dasharray", (d) => (d.isAsync ? "6 4" : "none"))
        .attr("marker-end", (d) => `url(#arrow-${d.criticality})`)
        .attr("cursor", "pointer")
        .on("click", (_event, d) => {
          onEdgeClickRef.current?.(d as GraphEdge);
        });

      // Port labels on edges
      const edgeLabelGroup = g.append("g").attr("class", "edge-labels");
      const edgeLabelElements = edgeLabelGroup
        .selectAll("text")
        .data(edges.filter((e) => e.port != null))
        .join("text")
        .text((d) => `:${d.port}`)
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("font-family", "monospace")
        .attr("fill", "#6b7280")
        .attr("pointer-events", "none");

      // Draw nodes
      const nodeGroup = g.append("g").attr("class", "nodes");
      const nodeElements = nodeGroup
        .selectAll<SVGGElement, SimNode>("g")
        .data(nodes)
        .join("g")
        .attr("cursor", "pointer")
        .on("click", (_event, d) => {
          onNodeClickRef.current?.(d as GraphNode);
        });

      // Add shapes per type
      nodeElements.each(function (d) {
        const el = d3.select(this);
        const color = NODE_COLORS[d.type];
        const strokeColor = TIER_STROKE[d.tier];
        const r = NODE_RADIUS;

        switch (d.type) {
          case "service":
            el.append("circle")
              .attr("r", r)
              .attr("fill", color)
              .attr("stroke", strokeColor)
              .attr("stroke-width", 2.5);
            break;
          case "queue":
            el.append("rect")
              .attr("x", -r)
              .attr("y", -r * 0.7)
              .attr("width", r * 2)
              .attr("height", r * 1.4)
              .attr("rx", 6)
              .attr("fill", color)
              .attr("stroke", strokeColor)
              .attr("stroke-width", 2.5);
            break;
          case "storage":
            el.append("rect")
              .attr("x", -r)
              .attr("y", -r)
              .attr("width", r * 2)
              .attr("height", r * 2)
              .attr("fill", color)
              .attr("stroke", strokeColor)
              .attr("stroke-width", 2.5);
            break;
          default: {
            const pathD = nodeShapePath(d.type, r);
            if (pathD) {
              el.append("path")
                .attr("d", pathD)
                .attr("fill", color)
                .attr("stroke", strokeColor)
                .attr("stroke-width", 2.5);
            } else {
              // Fallback to circle
              el.append("circle")
                .attr("r", r)
                .attr("fill", color)
                .attr("stroke", strokeColor)
                .attr("stroke-width", 2.5);
            }
          }
        }
      });

      // Labels
      const labelGroup = g.append("g").attr("class", "labels");
      labelGroup
        .selectAll("text")
        .data(nodes)
        .join("text")
        .text((d) => d.name)
        .attr("text-anchor", "middle")
        .attr("dy", NODE_RADIUS + 16)
        .attr("font-size", "12px")
        .attr("fill", "#374151")
        .attr("pointer-events", "none");

      // Drag behavior — only activate after mouse moves beyond threshold
      let hasDragged = false;
      let dragStartX = 0;
      let dragStartY = 0;
      const DRAG_THRESHOLD = 4;

      const drag = d3
        .drag<SVGGElement, SimNode>()
        .on("start", (event, d) => {
          hasDragged = false;
          dragStartX = event.x;
          dragStartY = event.y;
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          const dx = event.x - dragStartX;
          const dy = event.y - dragStartY;
          if (!hasDragged && dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
            hasDragged = true;
            if (!event.active) simulation.alphaTarget(0.1).restart();
          }
          if (hasDragged) {
            d.fx = event.x;
            d.fy = event.y;
          }
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          if (!hasDragged) {
            d.fx = null;
            d.fy = null;
            onNodeClickRef.current?.(d as GraphNode);
          } else {
            // Keep node pinned where it was dropped
            d.fx = event.x;
            d.fy = event.y;
          }
        });

      nodeElements.call(drag);

      // Tick
      simulation.on("tick", () => {
        edgeElements
          .attr("x1", (d) => (d.source as SimNode).x!)
          .attr("y1", (d) => (d.source as SimNode).y!)
          .attr("x2", (d) => (d.target as SimNode).x!)
          .attr("y2", (d) => (d.target as SimNode).y!);

        nodeElements.attr("transform", (d) => `translate(${d.x},${d.y})`);

        edgeLabelElements
          .attr("x", (d) => ((d.source as SimNode).x! + (d.target as SimNode).x!) / 2)
          .attr("y", (d) => ((d.source as SimNode).y! + (d.target as SimNode).y!) / 2 - 4);

        labelGroup
          .selectAll<SVGTextElement, SimNode>("text")
          .attr("x", (d) => d.x!)
          .attr("y", (d) => d.y!);
      });

      return () => {
        simulation.stop();
      };
    }, [graph]);

    // Main render effect
    useEffect(() => {
      const cleanup = renderGraph();
      return cleanup;
    }, [renderGraph]);

    // Resize observer
    useEffect(() => {
      if (!containerRef.current) return;

      const observer = new ResizeObserver(() => {
        renderGraph();
      });

      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }, [renderGraph]);

    // Impact highlight effect
    useEffect(() => {
      if (!svgRef.current) return;

      const svg = d3.select(svgRef.current);

      if (!impactResult) {
        // Reset all styles
        svg.selectAll(".nodes g")
          .attr("opacity", 1)
          .attr("filter", null);
        svg.selectAll(".nodes g :first-child")
          .attr("stroke", function () { return d3.select(this).attr("data-original-stroke") || d3.select(this).attr("stroke"); })
          .attr("stroke-width", 2.5);
        svg.selectAll(".edges line")
          .attr("opacity", 1)
          .attr("stroke", function () { return d3.select(this).attr("data-original-stroke") || d3.select(this).attr("stroke"); });
        svg.selectAll(".edge-labels text").attr("opacity", 1);
        svg.selectAll(".labels text").attr("opacity", 1);
        return;
      }

      const affected = new Set(impactResult.allAffected);
      affected.add(impactResult.sourceId);
      const hopDistance = impactResult.hopDistance ?? {};

      // --- Nodes ---
      svg.selectAll<SVGGElement, SimNode>(".nodes g").each(function (d) {
        const el = d3.select(this);
        const shape = el.select(":first-child");

        // Store original stroke for reset
        if (!shape.attr("data-original-stroke")) {
          shape.attr("data-original-stroke", shape.attr("stroke"));
        }

        if (d.id === impactResult.sourceId) {
          // Source node: red glow + red stroke
          el.attr("opacity", 1).attr("filter", "url(#impact-glow)");
          shape.attr("stroke", "#ef4444").attr("stroke-width", 4);
        } else if (affected.has(d.id)) {
          // Affected node: colored stroke by hop distance
          const hop = hopDistance[d.id] ?? 3;
          el.attr("opacity", 1).attr("filter", null);
          shape.attr("stroke", getHopColor(hop)).attr("stroke-width", 3.5);
        } else {
          // Unaffected node: dim + grayscale
          el.attr("opacity", IMPACT_DIM_OPACITY).attr("filter", "grayscale(1)");
          shape.attr("stroke-width", 2.5);
        }
      });

      // --- Edges ---
      svg.selectAll<SVGLineElement, SimEdge>(".edges line").each(function (d) {
        const el = d3.select(this);
        if (!el.attr("data-original-stroke")) {
          el.attr("data-original-stroke", el.attr("stroke"));
        }

        const srcId = typeof d.source === "string" ? d.source : d.source.id;
        const tgtId = typeof d.target === "string" ? d.target : d.target.id;
        const bothAffected = affected.has(srcId) && affected.has(tgtId);

        if (bothAffected) {
          const maxHop = Math.max(hopDistance[srcId] ?? 0, hopDistance[tgtId] ?? 0);
          el.attr("opacity", 1).attr("stroke", getHopColor(maxHop));
        } else {
          el.attr("opacity", IMPACT_DIM_OPACITY)
            .attr("stroke", el.attr("data-original-stroke") || el.attr("stroke"));
        }
      });

      // --- Edge labels ---
      svg.selectAll<SVGTextElement, SimEdge>(".edge-labels text")
        .attr("opacity", (d) => {
          const srcId = typeof d.source === "string" ? d.source : d.source.id;
          const tgtId = typeof d.target === "string" ? d.target : d.target.id;
          return affected.has(srcId) && affected.has(tgtId) ? 1 : IMPACT_DIM_OPACITY;
        });

      // --- Node labels ---
      svg.selectAll<SVGTextElement, SimNode>(".labels text")
        .attr("opacity", (d) => (affected.has(d.id) ? 1 : IMPACT_DIM_OPACITY));
    }, [impactResult]);

    return (
      <div ref={containerRef} className="w-full h-full relative">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    );
  }
);

export { ServiceGraphComponent as ServiceGraph };
