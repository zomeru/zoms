'use client';

import React from 'react';

import AnimatedCounter from './AnimatedCounter';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GitHubData {
  totalCommits: number;
  totalPRs: number;
  totalRepos: number;
  username: string;
  lastUpdated: string;
  unavailable?: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MetricRowProps {
  filled: boolean;
  label: string;
  value: number;
  unavailable?: boolean;
}

const MetricRow: React.FC<MetricRowProps> = ({ filled, label, value, unavailable = false }) => (
  <div className='flex items-center justify-between gap-8 py-0.75'>
    <span className='flex items-center gap-2'>
      <span className={filled ? 'text-terminal-green' : 'text-text-muted'} aria-hidden='true'>
        {filled ? '●' : '○'}
      </span>
      <span className='text-text-secondary text-xs'>{label}</span>
    </span>
    {unavailable ? (
      <span className='text-text-muted text-xs font-mono tabular-nums'>—</span>
    ) : (
      <AnimatedCounter
        target={value}
        duration={2200}
        className='text-text-primary text-xs font-mono tabular-nums'
      />
    )}
  </div>
);

interface CardBodyProps {
  gh: GitHubData;
  unavailable: boolean;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

const CardBody: React.FC<CardBodyProps> = ({ gh, unavailable }) => (
  <>
    <div className='px-4 pt-3 pb-2'>
      <p className='text-[10px] text-text-muted mb-1.5 tracking-wider'>// github</p>
      <MetricRow filled label='commits' value={gh.totalCommits} unavailable={unavailable} />
      <MetricRow
        filled={false}
        label='pull requests'
        value={gh.totalPRs}
        unavailable={unavailable}
      />
      <MetricRow
        filled={false}
        label='repositories'
        value={gh.totalRepos}
        unavailable={unavailable}
      />
    </div>
    <div className='px-4 py-2 border-t border-border'>
      <span className='text-[10px] text-text-muted'>
        {unavailable ? 'temporarily unavailable' : `updated ${formatDate(gh.lastUpdated)}`}
      </span>
    </div>
  </>
);

// ─── Main component ───────────────────────────────────────────────────────────

const UNAVAILABLE: GitHubData = {
  totalCommits: 0,
  totalPRs: 0,
  totalRepos: 0,
  username: 'zomeru',
  lastUpdated: new Date().toISOString(),
  unavailable: true
};

interface DevStatsCardProps {
  className?: string;
  initialData?: GitHubData;
}

const DevStatsCard: React.FC<DevStatsCardProps> = ({ className = '', initialData }) => {
  const gh = initialData ?? UNAVAILABLE;
  const unavailable = gh.unavailable === true;

  return (
    <div
      className={`
        w-fit bg-surface/80 border border-border rounded-lg overflow-hidden
        font-mono hover:border-primary/30 transition-colors duration-300
        ${className}
      `}
    >
      {/* Header */}
      <div className='flex items-center justify-between gap-6 px-4 py-3 border-b border-border'>
        <div className='flex items-center gap-2'>
          <span className='text-terminal-green text-xs' aria-hidden='true'>
            ●
          </span>
          <span className='text-xs text-text-muted tracking-widest uppercase'>Dev Metrics</span>
        </div>
        <span className='text-xs text-text-muted'>@{gh.username}</span>
      </div>

      {/* Body */}
      <CardBody gh={gh} unavailable={unavailable} />
    </div>
  );
};

export default DevStatsCard;
