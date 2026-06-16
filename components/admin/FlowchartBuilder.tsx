"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
type NodeType = "process" | "decision" | "terminal" | "io" | "connector" | "document" | "data";
type Mode = "select" | "connect" | "delete" | `add-${NodeType}`;

interface FNode {
  id: string;
  x: number; // centre X in SVG coords
  y: number; // centre Y
  type: NodeType;
  label: string;
  fill: string;
  stroke: string;
  textColor: string;
}

interface FEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  dashed: boolean;
}

// ─── Dimensions (half-width, half-height) ────────────────────
const HALF: Record<NodeType, [number, number]> = {
  process:   [70, 26],
  decision:  [65, 38],
  terminal:  [65, 26],
  io:        [70, 26],
  connector: [24, 24],
  document:  [70, 30],
  data:      [36, 36],
};

// ─── Colour palette ──────────────────────────────────────────
const PALETTE = [
  { fill: "#f0fdfa", stroke: "#0f766e", text: "#0f766e", name: "Teal" },
  { fill: "#eff6ff", stroke: "#2563eb", text: "#1d4ed8", name: "Blue" },
  { fill: "#f0fdf4", stroke: "#16a34a", text: "#15803d", name: "Green" },
  { fill: "#fffbeb", stroke: "#d97706", text: "#b45309", name: "Amber" },
  { fill: "#fff1f2", stroke: "#e11d48", text: "#be123c", name: "Red" },
  { fill: "#faf5ff", stroke: "#7c3aed", text: "#6d28d9", name: "Purple" },
  { fill: "#f8fafc", stroke: "#475569", text: "#334155", name: "Slate" },
];

const TYPE_DEFAULT: Record<NodeType, typeof PALETTE[0]> = {
  process:   PALETTE[0],
  decision:  PALETTE[3],
  terminal:  PALETTE[2],
  io:        PALETTE[1],
  connector: PALETTE[5],
  document:  PALETTE[6],
  data:      PALETTE[4],
};

const TYPE_LABELS: Record<NodeType, string> = {
  process: "Process", decision: "Decision?", terminal: "Start / End",
  io: "Input / Output", connector: "A", document: "Document", data: "Database",
};

// ─── Border intersection for arrow routing ───────────────────
function borderPt(n: FNode, tx: number, ty: number): [number, number] {
  const [hw, hh] = HALF[n.type];
  const dx = tx - n.x, dy = ty - n.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return [n.x, n.y];

  switch (n.type) {
    case "process":
    case "io":
    case "terminal":
    case "document": {
      if (Math.abs(dx) * hh > Math.abs(dy) * hw) {
        const t = hw / Math.abs(dx);
        return [n.x + t * dx, n.y + t * dy];
      } else {
        const t = hh / Math.abs(dy);
        return [n.x + t * dx, n.y + t * dy];
      }
    }
    case "decision": {
      if (Math.abs(dx) < 0.001) return [n.x, n.y + (dy > 0 ? hh : -hh)];
      if (Math.abs(dy) < 0.001) return [n.x + (dx > 0 ? hw : -hw), n.y];
      const t = (hw * hh) / (Math.abs(dy) * hw + Math.abs(dx) * hh);
      return [n.x + t * dx, n.y + t * dy];
    }
    case "connector":
    case "data": {
      return [n.x + (hw * dx) / len, n.y + (hh * dy) / len];
    }
  }
}

// ─── Shape renderer (in <g> already translated to centre) ────
function NodeShape({ n, selected }: { n: FNode; selected: boolean }) {
  const [hw, hh] = HALF[n.type];
  const w = hw * 2, h = hh * 2;
  const sx = -hw, sy = -hh;
  const strokeColor = selected ? "#0ea5e9" : n.stroke;
  const strokeWidth = selected ? 2.5 : 1.5;
  const base = { fill: n.fill, stroke: strokeColor, strokeWidth };

  switch (n.type) {
    case "process":
      return <rect x={sx} y={sy} width={w} height={h} rx={6} {...base} />;
    case "decision":
      return <polygon points={`0,${sy} ${hw},0 0,${hh} ${sx},0`} {...base} />;
    case "terminal":
      return <rect x={sx} y={sy} width={w} height={h} rx={hh} {...base} />;
    case "io":
      return <polygon points={`${sx + 14},${sy} ${sx + w},${sy} ${sx + w - 14},${sy + h} ${sx},${sy + h}`} {...base} />;
    case "connector":
      return <circle cx={0} cy={0} r={hw} {...base} />;
    case "document": {
      const wavAmp = 6;
      return (
        <path
          d={`M${sx},${sy} h${w} v${h - wavAmp} q${-w / 4},${wavAmp * 2} ${-w / 2},0 q${-w / 4},${-wavAmp * 2} ${-w / 2},0 Z`}
          {...base}
        />
      );
    }
    case "data":
      return (
        <>
          <ellipse cx={0} cy={sy + 10} rx={hw} ry={10} {...base} />
          <rect x={sx} y={sy + 10} width={w} height={h - 10} fill={n.fill} stroke={strokeColor} strokeWidth={strokeWidth} />
          <ellipse cx={0} cy={sy + h} rx={hw} ry={10} {...base} />
          <line x1={sx} y1={sy + 10} x2={sx} y2={sy + h} stroke={strokeColor} strokeWidth={strokeWidth} />
          <line x1={hw} y1={sy + 10} x2={hw} y2={sy + h} stroke={strokeColor} strokeWidth={strokeWidth} />
        </>
      );
  }
}

// ─── Main component ──────────────────────────────────────────
export default function FlowchartBuilder({
  onInsert,
  onClose,
  initialData,
}: {
  onInsert: (svg: string) => void;
  onClose: () => void;
  initialData?: { nodes: unknown[]; edges: unknown[] };
}) {
  const [nodes, setNodes] = useState<FNode[]>((initialData?.nodes ?? []) as FNode[]);
  const [edges, setEdges] = useState<FEdge[]>((initialData?.edges ?? []) as FEdge[]);
  const [mode, setMode] = useState<Mode>("select");
  const [selected, setSelected] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);

  // Drag
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number; mx: number; my: number } | null>(null);

  // Label edit
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  // View
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 60, y: 40 });

  // History
  const [history, setHistory] = useState<{ nodes: FNode[]; edges: FEdge[] }[]>([{
    nodes: (initialData?.nodes ?? []) as FNode[],
    edges: (initialData?.edges ?? []) as FEdge[],
  }]);
  const [hIdx, setHIdx] = useState(0);

  const svgRef = useRef<SVGSVGElement>(null);
  const genId = () => Math.random().toString(36).slice(2, 9);

  // Auto-focus edit input
  useEffect(() => { if ((editingNodeId || editingEdgeId) && editRef.current) editRef.current.focus(); }, [editingNodeId, editingEdgeId]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setMode("select"); setConnectFrom(null); setEditingNodeId(null); setEditingEdgeId(null); }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (editingNodeId || editingEdgeId) return;
        if (selected) deleteSelected();
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") { e.preventDefault(); doUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) { e.preventDefault(); doRedo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ── History helpers ──
  const pushHistory = useCallback((ns: FNode[], es: FEdge[]) => {
    setHistory(h => {
      const sliced = h.slice(0, hIdx + 1);
      const next = [...sliced, { nodes: ns, edges: es }];
      setHIdx(next.length - 1);
      return next;
    });
    setNodes(ns);
    setEdges(es);
  }, [hIdx]);

  const doUndo = () => {
    if (hIdx <= 0) return;
    const prev = history[hIdx - 1];
    setNodes(prev.nodes); setEdges(prev.edges); setHIdx(hIdx - 1);
  };
  const doRedo = () => {
    if (hIdx >= history.length - 1) return;
    const next = history[hIdx + 1];
    setNodes(next.nodes); setEdges(next.edges); setHIdx(hIdx + 1);
  };

  // ── SVG coords from mouse event ──
  const svgCoords = (e: React.MouseEvent): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  };

  // ── Add node ──
  const addNode = (type: NodeType, x: number, y: number) => {
    const c = TYPE_DEFAULT[type];
    const n: FNode = { id: genId(), x, y, type, label: TYPE_LABELS[type], fill: c.fill, stroke: c.stroke, textColor: c.text };
    const ns = [...nodes, n];
    pushHistory(ns, edges);
  };

  // ── Delete selected ──
  const deleteSelected = () => {
    if (!selected) return;
    const isNode = nodes.some(n => n.id === selected);
    if (isNode) {
      pushHistory(nodes.filter(n => n.id !== selected), edges.filter(e => e.from !== selected && e.to !== selected));
    } else {
      pushHistory(nodes, edges.filter(e => e.id !== selected));
    }
    setSelected(null);
  };

  // ── Canvas click ──
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!mode.startsWith("add-")) return;
    const type = mode.slice(4) as NodeType;
    const { x, y } = svgCoords(e);
    addNode(type, x, y);
    setMode("select");
  };

  // ── Node mousedown ──
  const onNodeDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (mode === "delete") {
      pushHistory(nodes.filter(n => n.id !== id), edges.filter(ed => ed.from !== id && ed.to !== id));
      if (selected === id) setSelected(null);
      return;
    }
    if (mode === "connect") {
      if (!connectFrom) { setConnectFrom(id); setSelected(id); }
      else if (connectFrom !== id) {
        if (!edges.some(ed => ed.from === connectFrom && ed.to === id)) {
          pushHistory(nodes, [...edges, { id: genId(), from: connectFrom, to: id, label: "", dashed: false }]);
        }
        setConnectFrom(null); setSelected(null); setMode("select");
      }
      return;
    }
    if (mode === "select") {
      setSelected(id);
      const node = nodes.find(n => n.id === id);
      if (node) setDragging({ id, ox: node.x, oy: node.y, mx: e.clientX, my: e.clientY });
    }
  };

  // ── Node double-click → edit label ──
  const onNodeDbl = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const n = nodes.find(x => x.id === id);
    if (n) { setEditingNodeId(id); setEditLabel(n.label); }
  };

  // ── Edge click ──
  const onEdgeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (mode === "delete") {
      pushHistory(nodes, edges.filter(ed => ed.id !== id));
      if (selected === id) setSelected(null);
    } else { setSelected(id); }
  };

  // ── Edge double-click → edit label ──
  const onEdgeDbl = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const ed = edges.find(x => x.id === id);
    if (ed) { setEditingEdgeId(id); setEditLabel(ed.label); }
  };

  // ── Mouse move & up ──
  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging) return;
    const dx = (e.clientX - dragging.mx) / zoom;
    const dy = (e.clientY - dragging.my) / zoom;
    setNodes(prev => prev.map(n => n.id === dragging.id ? { ...n, x: dragging.ox + dx, y: dragging.oy + dy } : n));
  };
  const onMouseUp = () => {
    if (dragging) {
      // commit move to history
      setHistory(h => {
        const sliced = h.slice(0, hIdx + 1);
        const next = [...sliced, { nodes, edges }];
        setHIdx(next.length - 1);
        return next;
      });
      setDragging(null);
    }
  };

  // ── Commit label edit ──
  const commitLabel = () => {
    if (editingNodeId) {
      const ns = nodes.map(n => n.id === editingNodeId ? { ...n, label: editLabel } : n);
      pushHistory(ns, edges);
      setEditingNodeId(null);
    }
    if (editingEdgeId) {
      const es = edges.map(ed => ed.id === editingEdgeId ? { ...ed, label: editLabel } : ed);
      pushHistory(nodes, es);
      setEditingEdgeId(null);
    }
  };

  const selectedNode = nodes.find(n => n.id === selected);
  const selectedEdge = edges.find(e => e.id === selected);

  // ── Auto-layout (top → bottom layered) ──
  const autoLayout = () => {
    if (nodes.length === 0) return;
    // Build adjacency
    const adj: Record<string, string[]> = {};
    nodes.forEach(n => { adj[n.id] = []; });
    edges.forEach(e => { adj[e.from]?.push(e.to); });
    // BFS to assign layers
    const layers: Record<string, number> = {};
    const visited = new Set<string>();
    const roots = nodes.filter(n => !edges.some(e => e.to === n.id));
    const queue = roots.length > 0 ? roots : [nodes[0]];
    queue.forEach(n => { layers[n.id] = 0; visited.add(n.id); });
    let qi = 0;
    while (qi < queue.length) {
      const cur = queue[qi++];
      (adj[cur.id] || []).forEach(nid => {
        if (!visited.has(nid)) {
          layers[nid] = (layers[cur.id] || 0) + 1;
          visited.add(nid); queue.push(nodes.find(n => n.id === nid)!);
        }
      });
    }
    // Unvisited get last layer
    nodes.forEach(n => { if (!(n.id in layers)) layers[n.id] = 0; });
    // Group by layer
    const layerGroups: Record<number, string[]> = {};
    Object.entries(layers).forEach(([id, l]) => { layerGroups[l] = layerGroups[l] || []; layerGroups[l].push(id); });
    const xPad = 180, yPad = 120, startX = 100, startY = 80;
    const ns = nodes.map(n => {
      const layer = layers[n.id] || 0;
      const group = layerGroups[layer] || [];
      const pos = group.indexOf(n.id);
      const totalW = (group.length - 1) * xPad;
      return { ...n, x: startX + pos * xPad - totalW / 2 + 360, y: startY + layer * yPad };
    });
    pushHistory(ns, edges);
  };

  // ── Generate export SVG ──
  const generateSVG = (): string => {
    if (nodes.length === 0) return "";
    const pad = 40;
    const minX = Math.min(...nodes.map(n => n.x - HALF[n.type][0])) - pad;
    const maxX = Math.max(...nodes.map(n => n.x + HALF[n.type][0])) + pad;
    const minY = Math.min(...nodes.map(n => n.y - HALF[n.type][1])) - pad;
    const maxY = Math.max(...nodes.map(n => n.y + HALF[n.type][1])) + pad;
    const W = maxX - minX, H = maxY - minY;

    const nMap = Object.fromEntries(nodes.map(n => [n.id, n]));
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const shapeStr = (n: FNode) => {
      const [hw, hh] = HALF[n.type];
      const cx = n.x - minX, cy = n.y - minY;
      const sx = cx - hw, sy = cy - hh;
      const w = hw * 2, h = hh * 2;
      const b = `fill="${n.fill}" stroke="${n.stroke}" stroke-width="1.5"`;
      let shape = "";
      switch (n.type) {
        case "process":   shape = `<rect x="${sx}" y="${sy}" width="${w}" height="${h}" rx="6" ${b}/>`; break;
        case "decision":  shape = `<polygon points="${cx},${sy} ${cx+hw},${cy} ${cx},${sy+h} ${cx-hw},${cy}" ${b}/>`; break;
        case "terminal":  shape = `<rect x="${sx}" y="${sy}" width="${w}" height="${h}" rx="${hh}" ${b}/>`; break;
        case "io":        shape = `<polygon points="${sx+14},${sy} ${sx+w},${sy} ${sx+w-14},${sy+h} ${sx},${sy+h}" ${b}/>`; break;
        case "connector": shape = `<circle cx="${cx}" cy="${cy}" r="${hw}" ${b}/>`; break;
        case "document": {
          const wa = 6;
          shape = `<path d="M${sx},${sy} h${w} v${h-wa} q${-w/4},${wa*2} ${-w/2},0 q${-w/4},${-wa*2} ${-w/2},0 Z" ${b}/>`;
          break;
        }
        case "data":
          shape = `<ellipse cx="${cx}" cy="${sy+10}" rx="${hw}" ry="10" ${b}/><rect x="${sx}" y="${sy+10}" width="${w}" height="${h-10}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="1.5"/><ellipse cx="${cx}" cy="${sy+h}" rx="${hw}" ry="10" ${b}/><line x1="${sx}" y1="${sy+10}" x2="${sx}" y2="${sy+h}" stroke="${n.stroke}" stroke-width="1.5"/><line x1="${cx+hw}" y1="${sy+10}" x2="${cx+hw}" y2="${sy+h}" stroke="${n.stroke}" stroke-width="1.5"/>`;
          break;
      }
      const fs = n.type === "connector" ? 10 : 11;
      const label = n.type === "connector" && n.label.length > 2 ? n.label.slice(0, 2) : esc(n.label);
      return `${shape}<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="'DM Sans',Arial,sans-serif" font-size="${fs}" fill="${n.textColor}" font-weight="600">${label}</text>`;
    };

    const edgeStr = (ed: FEdge) => {
      const fn = nMap[ed.from], tn = nMap[ed.to];
      if (!fn || !tn) return "";
      const fnS = { ...fn, x: fn.x - minX, y: fn.y - minY };
      const tnS = { ...tn, x: tn.x - minX, y: tn.y - minY };
      const [x1, y1] = borderPt(fnS, tnS.x, tnS.y);
      const [x2, y2] = borderPt(tnS, fnS.x, fnS.y);
      const dash = ed.dashed ? `stroke-dasharray="6,3"` : "";
      const mid = [(x1 + x2) / 2, (y1 + y2) / 2];
      const lbl = ed.label ? `<text x="${mid[0]}" y="${mid[1]-7}" text-anchor="middle" font-family="'DM Sans',Arial,sans-serif" font-size="9" fill="#64748b">${esc(ed.label)}</text>` : "";
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#475569" stroke-width="1.5" ${dash} marker-end="url(#fc-arrow)"/>${lbl}`;
    };

    // Encode diagram data for re-editing (base64 JSON)
    const diagramData = btoa(unescape(encodeURIComponent(JSON.stringify({ nodes, edges }))));

    return `<div class="fc-wrapper" data-fc="${diagramData}" contenteditable="false" style="display:inline-block;position:relative;margin:1.5rem 0;cursor:move;user-select:none;resize:both;overflow:auto;min-width:120px;min-height:80px;border:2px dashed transparent;border-radius:0.75rem;transition:border-color 0.15s" title="Double-click to edit · Drag to move · Resize from corner"><svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${H.toFixed(0)}" viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}" style="border:1px solid #e2e8f0;border-radius:0.75rem;background:#fafafa;display:block;width:100%;height:auto"><defs><marker id="fc-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="#475569"/></marker></defs>${edges.map(edgeStr).join("")}${nodes.map(shapeStr).join("")}</svg><div style="position:absolute;bottom:3px;right:5px;font-size:9px;color:#94a3b8;pointer-events:none;font-family:'DM Sans',sans-serif">✎ dbl-click to edit</div></div>`;
  };

  // ─── Shape panel items ──────────────────────────────────────
  const shapeItems: { mode: Mode; label: string; preview: JSX.Element }[] = [
    { mode: "add-process",   label: "Process",       preview: <rect x="2"  y="8"  width="36" height="16" rx="3"  fill="#f0fdfa" stroke="#0f766e" strokeWidth="1.5"/> },
    { mode: "add-decision",  label: "Decision",      preview: <polygon points="20,4 38,16 20,28 2,16" fill="#fffbeb" stroke="#d97706" strokeWidth="1.5"/> },
    { mode: "add-terminal",  label: "Terminal",      preview: <rect x="2"  y="9"  width="36" height="14" rx="7"  fill="#f0fdf4" stroke="#16a34a" strokeWidth="1.5"/> },
    { mode: "add-io",        label: "Input/Output",  preview: <polygon points="8,6 38,6 32,26 2,26" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.5"/> },
    { mode: "add-connector", label: "Connector",     preview: <circle cx="20" cy="16" r="12" fill="#faf5ff" stroke="#7c3aed" strokeWidth="1.5"/> },
    { mode: "add-document",  label: "Document",      preview: <path d="M2,6 h36 v16 q-9,8 -18,0 q-9,-8 -18,0 Z" fill="#f8fafc" stroke="#475569" strokeWidth="1.5"/> },
    { mode: "add-data",      label: "Database",      preview: <><ellipse cx="20" cy="9" rx="16" ry="6" fill="#fff1f2" stroke="#e11d48" strokeWidth="1.5"/><rect x="4" y="9" width="32" height="14" fill="#fff1f2" stroke="#e11d48" strokeWidth="1.5"/><ellipse cx="20" cy="23" rx="16" ry="6" fill="#fff1f2" stroke="#e11d48" strokeWidth="1.5"/></> },
  ];

  // ─── Cursor style ───────────────────────────────────────────
  const cursorStyle = () => {
    if (dragging) return "grabbing";
    if (mode.startsWith("add-")) return "crosshair";
    if (mode === "connect") return "cell";
    if (mode === "delete") return "not-allowed";
    return "default";
  };

  // ─── Edit input screen position ────────────────────────────
  const editPos = (): { left: number; top: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (editingNodeId) {
      const n = nodes.find(x => x.id === editingNodeId);
      if (!n) return null;
      return { left: n.x * zoom + pan.x + rect.left, top: n.y * zoom + pan.y + rect.top };
    }
    if (editingEdgeId) {
      const ed = edges.find(x => x.id === editingEdgeId);
      if (!ed) return null;
      const fn = nodes.find(x => x.id === ed.from), tn = nodes.find(x => x.id === ed.to);
      if (!fn || !tn) return null;
      return {
        left: ((fn.x + tn.x) / 2) * zoom + pan.x + rect.left,
        top: (((fn.y + tn.y) / 2) - 12) * zoom + pan.y + rect.top,
      };
    }
    return null;
  };
  const ep = editPos();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
          style={{ width: "min(98vw, 1020px)", height: "min(96vh, 700px)" }}
        >
          {/* ── Title bar ── */}
          <div className="bg-teal-900 px-5 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <Lucide.GitBranch className="w-4 h-4 text-teal-200" />
              <span className="text-sm font-bold text-white">Flowchart Builder</span>
              <span className="text-[9px] bg-teal-800/60 text-teal-200 px-2 py-0.5 rounded-full">
                {mode.startsWith("add-") ? `Click canvas to place ${mode.slice(4)}` : mode === "connect" ? (!connectFrom ? "Click source node" : "Click target node") : mode === "delete" ? "Click to delete" : "Select / Drag / Double-click to edit"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Undo/Redo */}
              <button onClick={doUndo} disabled={hIdx <= 0} title="Undo" className="p-1.5 text-teal-200 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-30 transition-all"><Lucide.Undo2 className="w-3.5 h-3.5" /></button>
              <button onClick={doRedo} disabled={hIdx >= history.length - 1} title="Redo" className="p-1.5 text-teal-200 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-30 transition-all"><Lucide.Redo2 className="w-3.5 h-3.5" /></button>
              <div className="w-px h-4 bg-teal-700 mx-1" />
              {/* Zoom */}
              <button onClick={() => setZoom(z => Math.max(z - 0.15, 0.3))} className="p-1.5 text-teal-200 hover:text-white hover:bg-white/10 rounded-lg transition-all"><Lucide.ZoomOut className="w-3.5 h-3.5" /></button>
              <span className="text-[10px] text-teal-300 w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(z + 0.15, 2.5))} className="p-1.5 text-teal-200 hover:text-white hover:bg-white/10 rounded-lg transition-all"><Lucide.ZoomIn className="w-3.5 h-3.5" /></button>
              <button onClick={() => { setZoom(1); setPan({ x: 60, y: 40 }); }} title="Reset view" className="p-1.5 text-teal-200 hover:text-white hover:bg-white/10 rounded-lg transition-all"><Lucide.Maximize2 className="w-3.5 h-3.5" /></button>
              <div className="w-px h-4 bg-teal-700 mx-1" />
              {/* Auto-layout */}
              <button onClick={autoLayout} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-teal-200 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                <Lucide.Layers className="w-3.5 h-3.5" /> Auto-Layout
              </button>
              {/* Clear */}
              <button onClick={() => { pushHistory([], []); setSelected(null); }} className="text-[10px] font-bold text-red-300 hover:text-red-200 hover:bg-red-900/30 px-2 py-1.5 rounded-lg transition-colors">Clear All</button>
              <div className="w-px h-4 bg-teal-700 mx-1" />
              {/* Insert */}
              <button
                onClick={() => { const svg = generateSVG(); if (svg) { onInsert(svg); onClose(); } else alert("Add at least one shape first!"); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-white text-teal-900 text-xs font-bold rounded-xl hover:bg-teal-50 transition-all shadow"
              >
                <Lucide.Check className="w-3.5 h-3.5" /> Insert into Document
              </button>
              <button onClick={onClose} className="p-1.5 text-teal-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"><Lucide.X className="w-4 h-4" /></button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex flex-1 min-h-0 overflow-hidden">

            {/* ── Left panel ── */}
            <div className="w-44 border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col shrink-0 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              {/* Tools */}
              <div className="px-3 pt-3">
                <p className="text-[8px] uppercase tracking-widest font-bold text-slate-400 mb-2">Tools</p>
                <div className="space-y-1">
                  {([
                    { m: "select" as Mode, icon: <Lucide.MousePointer2 className="w-3.5 h-3.5" />, label: "Select / Move", color: "" },
                    { m: "connect" as Mode, icon: <Lucide.ArrowRightCircle className="w-3.5 h-3.5" />, label: "Connect Nodes", color: "" },
                    { m: "delete" as Mode, icon: <Lucide.Trash2 className="w-3.5 h-3.5" />, label: "Delete", color: "text-red-500" },
                  ]).map(t => (
                    <button key={t.m} onClick={() => { setMode(t.m); if (t.m !== "connect") setConnectFrom(null); }}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all text-left border ${
                        mode === t.m
                          ? "bg-teal-800 text-white border-teal-900 shadow"
                          : `bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 ${t.color || "text-slate-600 dark:text-slate-300"} hover:border-teal-200 dark:hover:border-teal-800 hover:text-teal-700 dark:hover:text-teal-400`
                      }`}>
                      {t.icon}{t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shapes */}
              <div className="px-3 pt-3">
                <p className="text-[8px] uppercase tracking-widest font-bold text-slate-400 mb-2">Shapes</p>
                <div className="space-y-1">
                  {shapeItems.map(s => (
                    <button key={s.mode} onClick={() => { setMode(s.mode); setConnectFrom(null); }}
                      className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all text-left border ${
                        mode === s.mode
                          ? "bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800 shadow-sm"
                          : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-200 dark:hover:border-teal-800 hover:text-teal-700 dark:hover:text-teal-400"
                      }`}>
                      <svg width="40" height="32" className="shrink-0" overflow="visible">{s.preview}</svg>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Properties (when node selected) */}
              {selectedNode && (
                <div className="px-3 pt-3 pb-3 border-t border-slate-100 dark:border-slate-800 mt-3 space-y-2.5">
                  <p className="text-[8px] uppercase tracking-widest font-bold text-slate-400">Properties</p>
                  {/* Color */}
                  <div>
                    <p className="text-[8px] text-slate-400 mb-1 uppercase font-bold">Fill color</p>
                    <div className="flex flex-wrap gap-1">
                      {PALETTE.map((c, i) => (
                        <button key={i} title={c.name}
                          onClick={() => {
                            const ns = nodes.map(n => n.id === selectedNode.id ? { ...n, fill: c.fill, stroke: c.stroke, textColor: c.text } : n);
                            pushHistory(ns, edges);
                          }}
                          className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                          style={{ background: c.stroke, borderColor: selectedNode.stroke === c.stroke ? "#0f172a" : "transparent" }} />
                      ))}
                    </div>
                  </div>
                  {/* Toggle dashed edges */}
                  {edges.filter(e => e.from === selectedNode.id || e.to === selectedNode.id).length > 0 && (
                    <div>
                      <p className="text-[8px] text-slate-400 mb-1 uppercase font-bold">Connected Edges</p>
                      <button
                        onClick={() => {
                          const es = edges.map(e =>
                            e.from === selectedNode.id || e.to === selectedNode.id ? { ...e, dashed: !e.dashed } : e
                          );
                          pushHistory(nodes, es);
                        }}
                        className="text-[9px] text-teal-600 hover:text-teal-800 underline cursor-pointer bg-transparent border-none p-0">
                        Toggle dashed
                      </button>
                    </div>
                  )}
                  {/* Delete */}
                  <button
                    onClick={deleteSelected}
                    className="w-full text-[9px] text-red-500 hover:text-red-700 border border-red-200 dark:border-red-900/40 rounded-lg py-1.5 transition-colors bg-transparent cursor-pointer">
                    Delete Node
                  </button>
                </div>
              )}

              {/* Edge properties */}
              {selectedEdge && (
                <div className="px-3 pt-3 pb-3 border-t border-slate-100 dark:border-slate-800 mt-3 space-y-2.5">
                  <p className="text-[8px] uppercase tracking-widest font-bold text-slate-400">Edge Properties</p>
                  <div>
                    <p className="text-[8px] text-slate-400 mb-1 uppercase font-bold">Style</p>
                    <button
                      onClick={() => {
                        const es = edges.map(e => e.id === selectedEdge.id ? { ...e, dashed: !e.dashed } : e);
                        pushHistory(nodes, es);
                      }}
                      className={`text-[9px] px-2 py-1 rounded border font-semibold transition-all cursor-pointer ${selectedEdge.dashed ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-white text-slate-600 border-slate-200"}`}>
                      {selectedEdge.dashed ? "Dashed ✓" : "Solid"}
                    </button>
                  </div>
                  <button
                    onClick={() => { onEdgeDbl({ stopPropagation: () => {} } as any, selectedEdge.id); }}
                    className="w-full text-[9px] text-teal-600 border border-teal-200 dark:border-teal-800 rounded-lg py-1.5 transition-colors bg-transparent cursor-pointer hover:bg-teal-50">
                    Edit Label
                  </button>
                  <button onClick={deleteSelected} className="w-full text-[9px] text-red-500 border border-red-200 rounded-lg py-1.5 transition-colors bg-transparent cursor-pointer hover:bg-red-50">Delete Edge</button>
                </div>
              )}
            </div>

            {/* ── SVG Canvas ── */}
            <div className="flex-1 min-w-0 relative bg-slate-100 dark:bg-slate-950 overflow-hidden" style={{ cursor: cursorStyle() }}>
              {/* Connection hint */}
              {connectFrom && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[9px] font-bold px-2.5 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 shadow-sm">
                  <Lucide.ArrowRight className="w-3 h-3" /> Click a target node
                  <button onClick={() => setConnectFrom(null)} className="ml-1 opacity-60 hover:opacity-100 cursor-pointer bg-transparent border-none text-inherit">×</button>
                </div>
              )}

              {/* Empty state */}
              {nodes.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <Lucide.GitBranch className="w-14 h-14 text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-600">Select a shape from the panel</p>
                  <p className="text-xs text-slate-300 dark:text-slate-700 mt-1">then click anywhere on the canvas</p>
                </div>
              )}

              <svg
                ref={svgRef}
                width="100%" height="100%"
                onClick={mode.startsWith("add-") ? handleCanvasClick : (e) => { if (e.target === svgRef.current) setSelected(null); }}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                style={{ display: "block", userSelect: "none" }}
              >
                <defs>
                  {/* Grid pattern */}
                  <pattern id="fc-grid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse"
                    patternTransform={`translate(${pan.x % (20 * zoom)},${pan.y % (20 * zoom)})`}>
                    <path d={`M ${20 * zoom} 0 L 0 0 0 ${20 * zoom}`} fill="none" stroke="#e2e8f0" strokeWidth="0.5" opacity="0.7" />
                  </pattern>
                  {/* Arrow markers */}
                  <marker id="fc-arrow-n" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0,10 3.5,0 7" fill="#64748b" />
                  </marker>
                  <marker id="fc-arrow-s" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0,10 3.5,0 7" fill="#0ea5e9" />
                  </marker>
                  <marker id="fc-arrow-c" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0,10 3.5,0 7" fill="#0f766e" />
                  </marker>
                </defs>

                {/* Grid */}
                <rect width="100%" height="100%" fill="url(#fc-grid)" />

                <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                  {/* Edges */}
                  {edges.map(ed => {
                    const fn = nodes.find(n => n.id === ed.from);
                    const tn = nodes.find(n => n.id === ed.to);
                    if (!fn || !tn) return null;
                    const [sx, sy] = borderPt(fn, tn.x, tn.y);
                    const [ex, ey] = borderPt(tn, fn.x, fn.y);
                    const isSel = selected === ed.id;
                    const mx = (sx + ex) / 2, my = (sy + ey) / 2;
                    const isConnSrc = connectFrom === ed.from || connectFrom === ed.to;
                    const marker = isSel ? "fc-arrow-s" : isConnSrc ? "fc-arrow-c" : "fc-arrow-n";
                    return (
                      <g key={ed.id}>
                        {/* Wide click target */}
                        <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="transparent" strokeWidth={14}
                          onClick={(e) => onEdgeClick(e, ed.id)}
                          onDoubleClick={(e) => onEdgeDbl(e, ed.id)}
                          style={{ cursor: mode === "delete" ? "not-allowed" : "pointer" }} />
                        {/* Visible line */}
                        <line x1={sx} y1={sy} x2={ex} y2={ey}
                          stroke={isSel ? "#0ea5e9" : "#64748b"}
                          strokeWidth={isSel ? 2 : 1.5}
                          strokeDasharray={ed.dashed ? "6,3" : undefined}
                          markerEnd={`url(#${marker})`}
                          pointerEvents="none"
                        />
                        {ed.label && (
                          <text x={mx} y={my - 8} textAnchor="middle"
                            fontFamily="'DM Sans',sans-serif" fontSize={10} fill="#64748b"
                            style={{ pointerEvents: "none" }}>
                            {ed.label}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {nodes.map(node => {
                    const isSel = selected === node.id;
                    const isConnSrc = connectFrom === node.id;
                    return (
                      <g key={node.id}
                        transform={`translate(${node.x},${node.y})`}
                        onMouseDown={(e) => onNodeDown(e, node.id)}
                        onDoubleClick={(e) => onNodeDbl(e, node.id)}
                        style={{ cursor: mode === "select" ? (dragging?.id === node.id ? "grabbing" : "grab") : mode === "connect" ? "pointer" : mode === "delete" ? "not-allowed" : "crosshair" }}
                      >
                        {/* Selection / connect halo */}
                        {(isSel || isConnSrc) && (
                          <ellipse cx={0} cy={0}
                            rx={HALF[node.type][0] + 8} ry={HALF[node.type][1] + 8}
                            fill={isConnSrc ? "#f0fdfa" : "#e0f2fe"}
                            stroke={isConnSrc ? "#0f766e" : "#0ea5e9"}
                            strokeWidth={2} strokeDasharray="4,2" opacity={0.7}
                          />
                        )}
                        <NodeShape n={node} selected={isSel || isConnSrc} />
                        {/* Label */}
                        <text textAnchor="middle" dominantBaseline="middle" y={node.type === "data" ? 4 : 0}
                          fontFamily="'DM Sans',sans-serif"
                          fontSize={node.type === "connector" ? 12 : 11}
                          fill={node.textColor} fontWeight={600}
                          style={{ pointerEvents: "none", userSelect: "none" }}>
                          {node.type === "connector"
                            ? node.label.slice(0, 2)
                            : node.label.length > 20 ? node.label.slice(0, 19) + "…" : node.label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* Floating label editor */}
              {ep && (editingNodeId || editingEdgeId) && (
                <div style={{ position: "fixed", left: ep.left, top: ep.top, transform: "translate(-50%,-50%)", zIndex: 200 }}>
                  <input
                    ref={editRef}
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onBlur={commitLabel}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitLabel();
                      if (e.key === "Escape") { setEditingNodeId(null); setEditingEdgeId(null); }
                    }}
                    className="px-2.5 py-1.5 text-xs font-semibold border-2 border-teal-500 rounded-xl shadow-xl bg-white text-slate-900 outline-none ring-2 ring-teal-200"
                    style={{ minWidth: 110, textAlign: "center" }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Status bar ── */}
          <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 shrink-0">
            <div className="flex items-center gap-4 text-[9px] text-slate-400">
              <span className="font-bold text-slate-600 dark:text-slate-300">{nodes.length} nodes · {edges.length} edges</span>
              {selected && <span className="text-teal-600 dark:text-teal-400">Selected: {selectedNode?.label || (selectedEdge ? "Edge" : "")}</span>}
            </div>
            <div className="flex items-center gap-4 text-[9px] text-slate-400">
              <span><kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[8px]">Dbl-click</kbd> edit label</span>
              <span><kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[8px]">Del</kbd> delete selected</span>
              <span><kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[8px]">Ctrl+Z</kbd> undo</span>
              <span><kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[8px]">Esc</kbd> cancel</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
