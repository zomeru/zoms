import React from 'react';

import type { GitHubDevStats } from '@/lib/github';

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MetricRowProps {
  filled: boolean;
  label: string;
  value: number;
}

const MetricRow: React.FC<MetricRowProps> = ({ filled, label, value }) => (
  <div className='flex items-center justify-between gap-8 py-0.75'>
    <span className='flex items-center gap-2'>
      <span className={filled ? 'text-terminal-green' : 'text-text-muted'} aria-hidden='true'>
        {filled ? '●' : '○'}
      </span>
      <span className='text-text-secondary text-xs'>{label}</span>
    </span>
    <span
      className={`text-xs font-mono tabular-nums ${filled ? 'text-terminal-green' : 'text-text-primary'}`}
    >
      {value}
    </span>
  </div>
);

interface CardBodyProps {
  gh: GitHubDevStats;
}

const CardBody: React.FC<CardBodyProps> = ({ gh }) => (
  <>
    <div className='px-4 pt-3 pb-2'>
      <p className='text-[10px] text-text-muted mb-1.5 tracking-wider'>// github</p>
      <MetricRow filled label='contributions' value={gh.totalContributions} />
      <MetricRow filled label='commits' value={gh.totalCommits} />
      <MetricRow filled={false} label='pull requests' value={gh.totalPRs} />
      <MetricRow filled={false} label='repositories' value={gh.totalRepos} />
      <MetricRow filled={false} label='longest streak (days)' value={gh.longestStreak} />
    </div>
    <div className='px-4 py-2 border-t border-border'>
      <span className='text-[10px] text-terminal-yellow'>{`updated ${gh.lastUpdated}`}</span>
    </div>
  </>
);

// ─── Main component ───────────────────────────────────────────────────────────

const UNAVAILABLE: GitHubDevStats = {
  totalCommits: 0,
  totalPRs: 0,
  totalRepos: 0,
  username: 'zomeru',
  totalContributions: 0,
  longestStreak: 0,
  lastUpdated: new Date().toISOString()
};

interface DevStatsCardProps {
  className?: string;
  initialData?: GitHubDevStats;
}

const DevStatsCard: React.FC<DevStatsCardProps> = ({ className = '', initialData }) => {
  const gh = initialData ?? UNAVAILABLE;

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
        <span className='text-xs text-secondary'>@{gh.username}</span>
      </div>

      {/* Body */}
      <CardBody gh={gh} />
    </div>
  );
};

export default DevStatsCard;
