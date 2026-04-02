import type React from "react";

import { TechBadge } from "@/components/ui";
import { technologies } from "@/constants";

const TechStack: React.FC = (): React.JSX.Element => {
  return (
    <section id="technologies" className="pb-20">
      <h2 className="section-title">Technologies</h2>

      <div className="flex flex-wrap gap-2">
        {technologies.map((tech) => (
          <TechBadge key={tech.name} icon={<tech.Icon color={tech.color} />}>
            {tech.name}
          </TechBadge>
        ))}
      </div>
    </section>
  );
};

export default TechStack;
