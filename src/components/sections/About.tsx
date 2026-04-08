import Link from "next/link";
import type React from "react";

import { TITLE, technologies } from "@/constants";
import { getGitHubDevStats } from "@/lib/github";
import { formatIsoDate } from "@/lib/utils";
import { getWakaTimeStats } from "@/lib/wakatime";

import Socials from "../Socials";
import TerminalHero from "../TerminalHero";
import { DevStatsCard, NodeSection, TechBadge, WakaTimeTicker } from "../ui";

const About = async (): Promise<React.JSX.Element> => {
  const [wakaStats, ghStats] = await Promise.all([
    getWakaTimeStats(),
    getGitHubDevStats("zomeru").catch(() => ({
      totalCommits: 0,
      totalPRs: 0,
      totalRepos: 0,
      username: "zomeru",
      totalContributions: 0,
      longestStreak: 0,
      lastUpdated: formatIsoDate(new Date().toISOString())
    }))
  ]);

  const wakaLanguages = wakaStats?.languages.map((l) => ({ name: l.name, hours: l.hours })) ?? [];

  return (
    <section id="about" className="flex min-h-screen flex-col justify-center py-20">
      <WakaTimeTicker initialLanguages={wakaLanguages} />
      <div className="mt-20 grid grid-cols-1 gap-y-8 md:mt-0 md:grid-cols-2 md:gap-x-12 md:gap-y-0">
        <div>
          <div className="mb-12 text-center md:text-left">
            <h1 className="mb-4 font-light text-4xl text-primary md:text-5xl lg:text-6xl">
              {TITLE}
            </h1>
            <p className="mb-6 text-lg text-text-secondary">
              Software Engineer based in the Philippines, building modern web experiences with{" "}
              <span className="font-medium text-terminal-green">Next.js</span>,{" "}
              <span className="font-medium text-terminal-purple">TypeScript</span>, and practical{" "}
              <span className="font-medium text-terminal-green">AI</span> integrations.
            </p>
            <div className="flex justify-center md:justify-start">
              <Socials />
            </div>
          </div>

          <TerminalHero
            name={TITLE}
            title="Software Engineer"
            descriptions={[
              "Building the future, one line at a time.",
              "Full-stack developer & UI enthusiast.",
              "Turning coffee into code since 2020."
            ]}
          />

          <div className="mt-10">
            <p className="mb-4 text-center font-mono text-text-muted text-xs md:text-left">
              Tech Stack
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:justify-start">
              {technologies.map((tech) => (
                <TechBadge
                  key={tech.name}
                  variant="dot"
                  dotColor={tech.color}
                  className="hover:shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                >
                  {tech.name}
                </TechBadge>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-4 md:justify-start">
            <Link
              href="#projects"
              className="inline-flex items-center gap-2 rounded-md border border-terminal-green/40 bg-terminal-green/10 px-4 py-3 font-mono text-terminal-green text-xs uppercase tracking-[0.18em] transition-colors hover:bg-terminal-green/15"
            >
              <span className="text-terminal-blue">./</span>
              <span>View Projects</span>
            </Link>
            <Link
              href="#contact"
              className="inline-flex items-center gap-2 rounded-md border border-code-border px-4 py-3 font-mono text-text-muted text-xs uppercase tracking-[0.18em] transition-colors hover:border-border-hover hover:text-text-primary"
            >
              <span className="text-terminal-green">cd</span>
              <span>Get in Touch</span>
            </Link>
          </div>
        </div>

        {/* Right column — NodeSection owns fade cycle + random positions */}
        <div className="relative min-h-105 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {/* Canvas fades in/out on each cycle */}
            <div className="relative mx-auto flex h-full w-full items-center justify-center overflow-hidden p-5">
              <NodeSection />

              {/* Card stays still — never fades */}
              <div className="relative z-10 flex justify-center">
                <DevStatsCard initialData={ghStats} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
