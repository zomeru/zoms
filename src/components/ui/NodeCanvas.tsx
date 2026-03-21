'use client';

import React, { useEffect, useRef } from 'react';

import { getTrimmedLinePoints } from './NodeCanvas.geometry';

interface NodeCanvasProps {
  className?: string;
  seed?: number;
}

// ─── Node templates (index order matters — 0/1/2 are hubs) ───────────────────
const TEMPLATES = [
  { r: 52, rgb: [56, 189, 248] as const }, // Hub 0 — large sky-blue
  { r: 40, rgb: [56, 189, 248] as const }, // Hub 1 — large sky-blue
  { r: 18, rgb: [99, 102, 241] as const }, // Hub 2 — medium indigo
  { r: 6, rgb: [56, 189, 248] as const }, // Child of Hub 0
  { r: 5, rgb: [124, 58, 237] as const }, // Child of Hub 0
  { r: 7, rgb: [124, 58, 237] as const }, // Child of Hub 1
  { r: 5, rgb: [99, 102, 241] as const }, // Child of Hub 1
  { r: 6, rgb: [56, 189, 248] as const } // Child of Hub 2
];

// ─── Explicit edge topology [from, to, startTime_ms] ─────────────────────────
// Lines only begin after their source node is revealed.
// Hub 0 is the origin (t=0); everything else is reached by a line.
const EDGES: Array<[number, number, number]> = [
  [0, 1, 100], // Hub 0 → Hub 1
  [1, 2, 700], // Hub 1 → Hub 2  (hub 1 revealed at t=500)
  [0, 2, 900], // Hub 0 → Hub 2  (secondary cross-link)
  [0, 3, 500], // Hub 0 → Child 3
  [0, 4, 700], // Hub 0 → Child 4
  [1, 5, 800], // Hub 1 → Child 5
  [1, 6, 1000], // Hub 1 → Child 6
  [2, 7, 1350] // Hub 2 → Child 7  (hub 2 revealed at t=1100)
];

const LINE_DRAW_MS = 400;
const NODE_GROW_MS = 500;
const TOTAL_ANIM_MS = 2400;

// Node 0 is the origin — appears immediately.
// Every other node appears when the first line reaching it finishes drawing.
const NODE_REVEAL = (() => {
  const t = [0, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity];
  for (const edge of EDGES) {
    const reveal = edge[2] + LINE_DRAW_MS;
    if (reveal < t[edge[1]]) t[edge[1]] = reveal;
  }
  return t;
})();

interface Node {
  x: number;
  y: number;
  r: number;
  rgb: readonly [number, number, number];
}

const clamp = (v: number) => Math.max(0.04, Math.min(0.96, v));
const getGrowProgress = (elapsedMs: number, revealTime: number) =>
  Math.min(1, Math.max(0, (elapsedMs - revealTime) / NODE_GROW_MS));
const getGrowEase = (elapsedMs: number, revealTime: number) => {
  const growRaw = getGrowProgress(elapsedMs, revealTime);
  return growRaw <= 0 ? 0 : 1 - (1 - growRaw) ** 3;
};

// Place a child at a random angle/distance from its hub
function childNear(hx: number, hy: number): { x: number; y: number } {
  const angle = Math.random() * 2 * Math.PI;
  const dist = 0.18 + Math.random() * 0.16;
  return { x: clamp(hx + Math.cos(angle) * dist), y: clamp(hy + Math.sin(angle) * dist) };
}

// Hubs land in different canvas thirds; children orbit their hub
function randomNodes(): Node[] {
  const h0 = { x: 0.12 + Math.random() * 0.48, y: 0.08 + Math.random() * 0.42 };
  const h1 = { x: 0.42 + Math.random() * 0.46, y: 0.38 + Math.random() * 0.45 };
  const h2 = { x: 0.06 + Math.random() * 0.38, y: 0.5 + Math.random() * 0.38 };
  return [
    { ...TEMPLATES[0], ...h0 },
    { ...TEMPLATES[1], ...h1 },
    { ...TEMPLATES[2], ...h2 },
    { ...TEMPLATES[3], ...childNear(h0.x, h0.y) },
    { ...TEMPLATES[4], ...childNear(h0.x, h0.y) },
    { ...TEMPLATES[5], ...childNear(h1.x, h1.y) },
    { ...TEMPLATES[6], ...childNear(h1.x, h1.y) },
    { ...TEMPLATES[7], ...childNear(h2.x, h2.y) }
  ];
}

const NodeCanvas: React.FC<NodeCanvasProps> = ({ className = '', seed = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const nodesRef = useRef<Node[]>(randomNodes());
  const animStartRef = useRef<number | null>(null);

  // New seed → new random layout + restart animation
  useEffect(() => {
    nodesRef.current = randomNodes();
    animStartRef.current = null;
  }, [seed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = (ts: number) => {
      animStartRef.current ??= ts;
      const ae = ts - animStartRef.current;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      const postAnim = Math.max(0, ae - TOTAL_ANIM_MS);
      const pulse = ae >= TOTAL_ANIM_MS ? 0.88 + 0.12 * Math.sin(postAnim * 0.00075) : 1;

      const pts = nodesRef.current.map((n) => ({ ...n, px: n.x * W, py: n.y * H }));

      // ── Lines ────────────────────────────────────────────────────────────────
      const paintLines = () => {
        for (const edge of EDGES) {
          const [from, to, startTime] = edge;
          const drawRaw = Math.min(1, Math.max(0, (ae - startTime) / LINE_DRAW_MS));
          if (drawRaw <= 0) continue;

          const drawEase = 1 - (1 - drawRaw) ** 2; // easeOutQuad
          const isHubHub = from <= 2 && to <= 2;
          const fromRadius = pts[from].r * getGrowEase(ae, NODE_REVEAL[from] ?? 0);
          const toRadius = pts[to].r * getGrowEase(ae, NODE_REVEAL[to] ?? 0);
          const { startX, startY, endX, endY } = getTrimmedLinePoints(
            { x: pts[from].px, y: pts[from].py, radius: fromRadius },
            { x: pts[to].px, y: pts[to].py, radius: toRadius }
          );
          const dist = Math.hypot(startX - endX, startY - endY);

          ctx.save();
          ctx.setLineDash([dist * drawEase, dist]);
          ctx.lineDashOffset = 0;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = `rgba(148, 163, 184, ${(isHubHub ? 0.35 : 0.25) * pulse})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
      };

      // ── Nodes ─────────────────────────────────────────────────────────────────
      const paintNodes = () => {
        for (let i = 0; i < pts.length; i += 1) {
          const revealTime = NODE_REVEAL[i] ?? 0;
          const growRaw = getGrowProgress(ae, revealTime);
          if (growRaw <= 0) continue;

          const growEase = getGrowEase(ae, revealTime);
          const [r, g, b] = pts[i].rgb;
          ctx.beginPath();
          ctx.arc(pts[i].px, pts[i].py, pts[i].r * growEase, 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fill();
        }
      };

      paintLines();
      paintNodes();
    };

    const resize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth ?? canvas.offsetWidth;
      const height = parent?.clientHeight ?? canvas.offsetHeight;

      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
    };

    resize();

    const loop = (ts: number) => {
      draw(ts);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas ref={canvasRef} className={`w-full h-full block ${className}`} aria-hidden='true' />
  );
};

export default NodeCanvas;
