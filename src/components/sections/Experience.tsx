import type React from "react";

import ExperienceTimeline from "./ExperienceTimeline";

const Experience: React.FC = async (): Promise<React.JSX.Element> => {
  const { getExperience } = await import("@/lib/experience");
  const experience = await getExperience();

  return (
    <section id="experience" className="pb-20">
      <h2 className="section-title">Experience</h2>

      <ExperienceTimeline experiences={experience} />

      <div className="mt-4">
        <a
          href="/assets/GREGORIO_ZOMER_RESUME.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <span className="text-terminal-green">cat</span>
          <span className="text-terminal-blue">→</span>
          <span>resume.pdf</span>
        </a>
      </div>
    </section>
  );
};

export default Experience;
