"use client";

import type { PortableTextBlock } from "@portabletext/types";
import { useEffect, useRef, useState } from "react";

interface ExperienceData {
  _id?: string;
  title: string;
  company: string;
  companyWebsite?: string;
  location: string;
  range: string;
  summary?: string;
  techStack?: string[];
  duties: PortableTextBlock[];
  order: number;
}

function useInView(margin = "-80px") {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: margin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [margin]);

  return { ref, isInView };
}

function TimelineItem({
  experience,
  index,
  isFirst
}: {
  experience: ExperienceData;
  index: number;
  isFirst: boolean;
}) {
  const { ref, isInView } = useInView();
  const delay = index * 100;

  return (
    <div ref={ref} className="relative flex gap-6 md:gap-10">
      {/* Timeline node */}
      <div className="relative flex flex-col items-center">
        <div
          className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center transition-all duration-400 ease-out"
          style={{
            transform: isInView ? "scale(1)" : "scale(0)",
            opacity: isInView ? 1 : 0,
            transitionDelay: `${delay}ms`
          }}
        >
          <div className="h-3 w-3 rounded-full border-2 border-primary bg-background" />
          {isFirst && (
            <div className="absolute h-3 w-3 animate-[pulse-ring_2s_ease-in-out_infinite] rounded-full bg-primary" />
          )}
        </div>
        <div className="w-px grow bg-border" />
      </div>

      {/* Card */}
      <div
        className="group mb-8 flex-1 rounded-xl border border-code-border bg-code-bg p-5 transition-all duration-500 ease-out hover:border-border-hover hover:shadow-[0_0_24px_rgba(99,102,241,0.08)]"
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? "translateY(0)" : "translateY(10px)",
          transitionDelay: `${delay + 150}ms`
        }}
      >
        {/* Header */}
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-terminal-green">{experience.title}</span>
              {isFirst && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] text-primary">
                  current
                </span>
              )}
            </div>
            <div className="mt-0.5">
              <span className="text-sm text-text-muted">@ </span>
              {experience.companyWebsite ? (
                <a
                  href={experience.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-terminal-purple hover:underline"
                >
                  {experience.company}
                </a>
              ) : (
                <span className="text-sm text-terminal-purple">{experience.company}</span>
              )}
            </div>
          </div>
          <span className="rounded-md bg-surface-elevated px-2.5 py-1 font-mono text-text-muted text-xs">
            {experience.range}
          </span>
        </div>

        {/* Location */}
        <div className="mb-3 text-text-muted text-xs">
          <span className="text-terminal-yellow">location:</span> {experience.location}
        </div>

        {/* Summary */}
        {experience.summary && (
          <p className="mb-4 text-sm text-text-secondary leading-relaxed">{experience.summary}</p>
        )}

        {/* Tech Stack */}
        {experience.techStack && experience.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {experience.techStack.map((tech) => (
              <span key={tech} className="tech-badge">
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressLine({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateProgress = () => {
      const rect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const start = viewportHeight * 0.8;
      const end = viewportHeight * 0.4;

      const topRelative = rect.top;
      const bottomRelative = rect.bottom;

      if (topRelative > start) {
        setProgress(0);
        return;
      }

      if (bottomRelative < end) {
        setProgress(1);
        return;
      }

      const totalScrollRange = rect.height - (viewportHeight - start) + (viewportHeight - end);
      const scrolled = start - topRelative;
      setProgress(Math.max(0, Math.min(1, scrolled / totalScrollRange)));
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    return () => window.removeEventListener("scroll", updateProgress);
  }, [containerRef]);

  return (
    <div
      className="absolute top-0 left-1.75 h-full w-0.5 origin-top bg-linear-to-b from-primary via-secondary to-accent"
      style={{
        transform: `scaleY(${progress})`,
        opacity: progress > 0.01 ? 1 : 0,
        transition: "opacity 0.3s ease"
      }}
    />
  );
}

export default function ExperienceTimeline({ experiences }: { experiences: ExperienceData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative">
      <ProgressLine containerRef={containerRef} />
      <div className="relative">
        {experiences.map((exp, index) => {
          const id =
            exp.title.replaceAll(" ", "-").toLowerCase() +
            "-" +
            exp.company.replaceAll(" ", "-").toLowerCase();

          return <TimelineItem key={id} experience={exp} index={index} isFirst={index === 0} />;
        })}
      </div>
    </div>
  );
}
