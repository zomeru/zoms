import { getProjects } from "@/lib/projects";

import { ProjectsClient } from "./ProjectsClient";

export async function Projects() {
  const projects = await getProjects();

  return (
    <section id="projects" className="py-20">
      <h2 className="section-title">Projects</h2>
      <ProjectsClient projects={projects} />
    </section>
  );
}
