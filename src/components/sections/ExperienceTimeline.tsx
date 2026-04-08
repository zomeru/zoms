"use client";

import type { PortableTextBlock } from "@portabletext/types";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

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

function TimelineItem({
  experience,
  index,
  isFirst
}: {
  experience: ExperienceData;
  index: number;
  isFirst: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="relative flex gap-6 md:gap-10">
      {/* Timeline node */}
      <div className="relative flex flex-col items-center">
        <motion.div
          className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <div className="h-3 w-3 rounded-full border-2 border-primary bg-background" />
          {isFirst && (
            <motion.div
              className="absolute h-3 w-3 rounded-full bg-primary"
              animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
          )}
        </motion.div>
        <div className="w-px grow bg-border" />
      </div>

      {/* Card */}
      <motion.div
        className="group mb-8 flex-1 rounded-xl border border-code-border bg-code-bg p-5 transition-all duration-300 hover:border-border-hover hover:shadow-[0_0_24px_rgba(99,102,241,0.08)]"
        initial={{ opacity: 0, x: 30, y: 10 }}
        animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: 30, y: 10 }}
        transition={{ duration: 0.5, delay: index * 0.1 + 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
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
      </motion.div>
    </div>
  );
}

function ProgressLine({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.4"]
  });

  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.05], [0, 1]);

  return (
    <motion.div
      className="absolute top-0 left-1.75 h-full w-0.5 origin-top bg-linear-to-b from-primary via-secondary to-accent"
      style={{ scaleY, opacity }}
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
