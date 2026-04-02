import type React from "react";

import type { GitHubDevStats } from "@/lib/github";

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MetricRowProps {
  filled: boolean;
  label: string;
  value: number;
}

const MetricRow: React.FC<MetricRowProps> = ({ filled, label, value }) => (
  <div className="flex items-center justify-between gap-8 py-0.75">
    <span className="flex items-center gap-2">
      <span className={filled ? "text-terminal-green" : "text-text-muted"} aria-hidden="true">
        {filled ? "●" : "○"}
      </span>
      <span className="text-text-secondary text-xs">{label}</span>
    </span>
    <span
      className={`font-mono text-xs tabular-nums ${filled ? "text-terminal-green" : "text-text-primary"}`}
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
    <div className="px-4 pt-3 pb-2">
      <p className="mb-1.5 text-[10px] text-text-muted tracking-wider">{"// github"}</p>
      <MetricRow filled label="contributions" value={gh.totalContributions} />
      <MetricRow filled label="commits" value={gh.totalCommits} />
      <MetricRow filled={false} label="pull requests" value={gh.totalPRs} />
      <MetricRow filled={false} label="repositories" value={gh.totalRepos} />
      <MetricRow filled={false} label="longest streak (days)" value={gh.longestStreak} />
    </div>
    <div className="border-border border-t px-4 py-2">
      <span className="text-[10px] text-terminal-yellow">{`updated ${gh.lastUpdated}`}</span>
    </div>
  </>
);

// ─── Main component ───────────────────────────────────────────────────────────

const UNAVAILABLE: GitHubDevStats = {
  totalCommits: 0,
  totalPRs: 0,
  totalRepos: 0,
  username: "zomeru",
  totalContributions: 0,
  longestStreak: 0,
  lastUpdated: new Date().toISOString()
};

interface DevStatsCardProps {
  className?: string;
  initialData?: GitHubDevStats;
}

const DevStatsCard: React.FC<DevStatsCardProps> = ({ className = "", initialData }) => {
  const gh = initialData ?? UNAVAILABLE;

  return (
    <div
      className={`w-fit overflow-hidden rounded-lg border border-border bg-surface/80 font-mono transition-colors duration-300 hover:border-primary/30 ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-6 border-border border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-terminal-green text-xs" aria-hidden="true">
            ●
          </span>
          <span className="text-text-muted text-xs uppercase tracking-widest">Dev Metrics</span>
        </div>
        <span className="text-secondary text-xs">@{gh.username}</span>
      </div>

      {/* Body */}
      <CardBody gh={gh} />
    </div>
  );
};

export default DevStatsCard;
