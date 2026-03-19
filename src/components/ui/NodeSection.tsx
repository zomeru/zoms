'use client';

import React, { useEffect, useRef, useState } from 'react';

import DevStatsCard, { type GitHubData } from './DevStatsCard';
import NodeCanvas from './NodeCanvas';

const CYCLE_MS = 5000; // time between repositions
const FADE_MS = 600; // canvas fade-out / fade-in duration

/**
 * NodeSection
 *
 * Only the canvas fades and cycles every 5 seconds.
 * DevStatsCard is always visible and never animates.
 */
interface NodeSectionProps {
  initialGitHubData?: GitHubData;
}

const NodeSection: React.FC<NodeSectionProps> = ({ initialGitHubData }) => {
  const [canvasVisible, setCanvasVisible] = useState(false);
  const [seed, setSeed] = useState(0);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Entrance: fade canvas in shortly after mount
  useEffect(() => {
    const t = setTimeout(() => setCanvasVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Cycle: every CYCLE_MS fade canvas out → randomize → fade back in
  useEffect(() => {
    const afterFade = () => {
      setSeed((s) => s + 1);
      window.dispatchEvent(new CustomEvent('node-cycle'));
      setCanvasVisible(true);
    };

    cycleTimerRef.current = setInterval(() => {
      setCanvasVisible(false);
      fadeTimerRef.current = setTimeout(afterFade, FADE_MS + 60);
    }, CYCLE_MS);

    return () => {
      if (cycleTimerRef.current) clearInterval(cycleTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  return (
    <div className='w-full h-full flex items-center justify-center relative'>
      {/* Canvas fades in/out on each cycle */}
      <div
        className='absolute inset-0'
        style={{
          opacity: canvasVisible ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ease-in-out`
        }}
      >
        <NodeCanvas seed={seed} className='w-full h-full' />
      </div>

      {/* Card stays still — never fades */}
      <div className='relative z-10 flex justify-center'>
        <DevStatsCard initialData={initialGitHubData} />
      </div>
    </div>
  );
};

export default NodeSection;
