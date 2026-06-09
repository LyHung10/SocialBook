'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { KnowledgeEntity, KnowledgeRelationship } from '@/features/chapters/types/chapter.interface';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: string;
  importance: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  type: string;
  description?: string;
  bendDir: number;
}

const TYPE_COLORS: Record<string, string> = {
  character: '#3b82f6',
  location: '#10b981',
  concept: '#f59e0b',
  event: '#ef4444',
  vocabulary: '#ec4899',
  reference: '#a855f7',
};

const TYPE_LABELS: Record<string, string> = {
  character: 'Nhân vật',
  location: 'Địa danh',
  concept: 'Khái niệm',
  event: 'Sự kiện',
  vocabulary: 'Từ vựng',
  reference: 'Điển tích',
};

const DEFAULT_COLOR = '#8b5cf6';
const getNodeColor = (type: string) => TYPE_COLORS[type] || DEFAULT_COLOR;

interface KnowledgeGraphProps {
  entities: KnowledgeEntity[];
  relationships: KnowledgeRelationship[];
  isOpen?: boolean;
}

export const KnowledgeGraph = ({ entities, relationships, isOpen = true }: KnowledgeGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const lastDimsRef = useRef({ width: 0, height: 0 });
  const rafRef = useRef(0);

  const allTypes = useMemo(() => {
    const types = new Set(entities.map(e => e.type));
    return Array.from(types);
  }, [entities]);

  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(allTypes));

  const prevTypesRef = useRef(allTypes.join(','));
  useEffect(() => {
    const key = allTypes.join(',');
    if (key !== prevTypesRef.current) {
      prevTypesRef.current = key;
      const timer = setTimeout(() => setActiveTypes(new Set(allTypes)), 0);
      return () => clearTimeout(timer);
    }
  }, [allTypes]);

  const toggleType = useCallback((type: string) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          const w = Math.round(entry.contentRect.width);
          const h = Math.round(entry.contentRect.height);
          if (w !== lastDimsRef.current.width || h !== lastDimsRef.current.height) {
            lastDimsRef.current = { width: w, height: h };
            setDimensions({ width: w, height: h });
          }
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const data = useMemo(() => {
    const filteredEntities = entities.filter(e => activeTypes.has(e.type));
    const filteredNames = new Set(filteredEntities.map(e => e.name));

    const nodes: GraphNode[] = filteredEntities.map(e => ({
      id: e.name,
      name: e.name,
      type: e.type,
      importance: e.importance,
    }));

    const links: GraphLink[] = relationships
      .filter(r => filteredNames.has(r.source) && filteredNames.has(r.target))
      .map((r, i) => ({
        source: r.source,
        target: r.target,
        type: r.type,
        description: r.description,
        bendDir: i % 2 === 0 ? 1 : -1,
      }));

    return { nodes, links };
  }, [entities, relationships, activeTypes]);

  // Connected node IDs cache for hover highlight
  const connectedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen || !svgRef.current || dimensions.width === 0 || dimensions.height === 0) {
      if (svgRef.current) d3.select(svgRef.current).selectAll('*').remove();
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { nodes, links } = data;
    if (nodes.length === 0) return;

    // Column positions for type clustering
    const typeOrder = Array.from(new Set(nodes.map(n => n.type)));
    const colWidth = dimensions.width / (typeOrder.length + 1);
    const typeXPos: Record<string, number> = {};
    typeOrder.forEach((t, i) => { typeXPos[t] = colWidth * (i + 1); });

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(180))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('x', d3.forceX(d => typeXPos[(d as GraphNode).type] || dimensions.width / 2).strength(0.5))
      .force('y', d3.forceY(dimensions.height / 2).strength(0.08))
      .force('collision', d3.forceCollide<GraphNode>().radius(d => d.importance * 1.5 + 22));

    const g = svg.append('g');

    // Column labels
    const colLabelG = g.append('g');
    typeOrder.forEach((type, i) => {
      colLabelG.append('text')
        .attr('x', colWidth * (i + 1))
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', '800')
        .attr('fill', getNodeColor(type))
        .attr('opacity', 0.5)
        .attr('style', 'text-transform: uppercase; letter-spacing: 1px;')
        .text(TYPE_LABELS[type] || type);
    });

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#666666')
      .style('stroke', 'none');

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => { g.attr('transform', event.transform); });
    svg.call(zoom);

    // Curved links
    const linkGroup = g.append('g').attr('class', 'links');
    const link = linkGroup
      .selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', '#888888')
      .attr('stroke-opacity', 0.2)
      .attr('stroke-width', 0.75)
      .attr('marker-end', 'url(#arrowhead)');

    const linkPath = (l: GraphLink) => {
      const s = l.source as GraphNode;
      const t = l.target as GraphNode;
      if (!s.x || !s.y || !t.x || !t.y) return '';
      const dx = t.x - s.x;
      const cp = { x: (s.x + t.x) / 2, y: (s.y + t.y) / 2 + l.bendDir * Math.abs(dx) * 0.25 };
      return `M${s.x},${s.y} Q${cp.x},${cp.y} ${t.x},${t.y}`;
    };

    simulation.on('tick', () => {
      link.attr('d', linkPath);
      node.attr('transform', d => `translate(${d.x}, ${d.y})`);
    });

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .style('cursor', 'grab')
      .style('transition', 'opacity 0.15s')
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      })
      .on('mouseenter', (event: MouseEvent, d) => {
        setHoveredNode(d);
        setTooltipPos({ x: event.offsetX, y: event.offsetY });

        const connected = new Set<string>([d.id]);
        links.forEach(l => {
          const src = l.source as GraphNode;
          const tgt = l.target as GraphNode;
          if (src.id === d.id) connected.add(tgt.id);
          if (tgt.id === d.id) connected.add(src.id);
        });
        connectedIdsRef.current = connected;

        node.attr('opacity', (n: GraphNode) => connected.has(n.id) ? 1 : 0.15);
        link.attr('stroke-opacity', (l: GraphLink) => {
          const src = l.source as GraphNode;
          const tgt = l.target as GraphNode;
          return connected.has(src.id) && connected.has(tgt.id) ? 0.6 : 0.05;
        });
      })
      .on('mousemove', (event: MouseEvent) => {
        setTooltipPos({ x: event.offsetX, y: event.offsetY });
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
        connectedIdsRef.current.clear();
        node.attr('opacity', 1);
        link.attr('stroke-opacity', 0.35);
        colLabelG.attr('opacity', 1);
      })
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Node circles
    node.append('circle')
      .attr('r', d => d.importance * 1.5 + 10)
      .attr('fill', d => getNodeColor(d.type))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Node labels (always visible, short)
    node.append('text')
      .text(d => d.name.length > 12 ? d.name.slice(0, 10) + '…' : d.name)
      .attr('dy', d => d.importance * 1.5 + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('style', 'pointer-events: none; text-shadow: 0 0 6px rgba(0,0,0,0.9);');

    svg.on('click', () => setSelectedNode(null));

    return () => {
      simulation.stop();
      svg.on('.zoom', null);
    };
  }, [data, dimensions, isOpen]);

  const filteredCount = activeTypes.size;
  const totalTypes = allTypes.length;

  const hoveredEntityData = hoveredNode
    ? entities.find(e => e.name === hoveredNode.name)
    : null;

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-muted/5 rounded-2xl border border-border/50">
      <svg ref={svgRef} className="w-full h-full" />

      {/* Tooltip on hover */}
      <AnimatePresence>
        {hoveredNode && hoveredEntityData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1 }}
            className="absolute pointer-events-none z-10 max-w-[200px] p-2.5 bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl"
            style={{
              left: Math.min(tooltipPos.x + 12, dimensions.width - 220),
              top: Math.max(tooltipPos.y - 10, 10),
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: getNodeColor(hoveredNode.type) }}
              />
              <span className="text-xs font-black">{hoveredNode.name}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {hoveredEntityData.description}
            </p>
            <Badge variant="outline" className="text-[8px] mt-1 px-1">
              {TYPE_LABELS[hoveredNode.type] || hoveredNode.type} · {hoveredNode.importance}/10
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend + Filter */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 p-3 bg-background/80 backdrop-blur-md border border-border rounded-xl max-w-[160px]">
        {allTypes.map(type => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
          >
            <div
              className={`w-3 h-3 rounded-full shrink-0 ${activeTypes.has(type) ? '' : 'opacity-30'}`}
              style={{ backgroundColor: getNodeColor(type) }}
            />
            <span className={`text-[10px] font-bold ${activeTypes.has(type) ? '' : 'line-through opacity-40'}`}>
              {TYPE_LABELS[type] || type}
            </span>
          </button>
        ))}
        {totalTypes > 0 && (
          <Badge variant="outline" className="text-[8px] mt-1 px-1 justify-center">
            {filteredCount}/{totalTypes}
          </Badge>
        )}
      </div>

      {/* Selected Node Info */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 p-4 bg-background/95 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs uppercase shrink-0"
                  style={{ backgroundColor: getNodeColor(selectedNode.type) }}
                >
                  {selectedNode.type[0]}
                </div>
                <h4 className="text-sm font-black truncate">{selectedNode.name}</h4>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full shrink-0" onClick={() => setSelectedNode(null)}>×</Button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {entities.find(e => e.name === selectedNode.name)?.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4 flex flex-col gap-1">
        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg shadow-sm" onClick={() => { const el = svgRef.current; if (!el) return; const svg = d3.select(el); const currentZoom = d3.zoomTransform(el); svg.transition().call((sel: d3.Transition<SVGSVGElement, unknown, null, undefined>) => (d3.zoom<SVGSVGElement, unknown>().transform as unknown as (sel: d3.Transition<SVGSVGElement, unknown, null, undefined>, transform: d3.ZoomTransform) => void)(sel, currentZoom.scale(1.2))); }}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg shadow-sm" onClick={() => { const el = svgRef.current; if (!el) return; const svg = d3.select(el); const currentZoom = d3.zoomTransform(el); svg.transition().call((sel: d3.Transition<SVGSVGElement, unknown, null, undefined>) => (d3.zoom<SVGSVGElement, unknown>().transform as unknown as (sel: d3.Transition<SVGSVGElement, unknown, null, undefined>, transform: d3.ZoomTransform) => void)(sel, currentZoom.scale(0.8))); }}>
          <ZoomOut className="w-4 h-4" />
        </Button>
      </div>

      <div className="absolute bottom-4 right-4 p-3 bg-background/50 backdrop-blur-sm border border-border rounded-xl pointer-events-none">
        <p className="text-[9px] font-medium text-muted-foreground">
          • Kéo để di chuyển nút<br />
          • Cuộn để phóng to/thu nhỏ<br />
          • Hover node để xem chi tiết
        </p>
      </div>
    </div>
  );
};
