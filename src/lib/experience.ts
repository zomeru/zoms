import type { PortableTextBlock } from "@portabletext/types";

import { experience as fallbackExperience } from "@/constants/experience";

import log from "./logger";
import { getSanityClient } from "./sanity";

export interface Experience {
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

const timelineDefaults: Record<string, { summary: string; techStack: string[] }> = {
  "Seansoft Corporation": {
    summary:
      "Building and modernizing full-stack features for a mineral management platform, from legacy migration to performance optimization.",
    techStack: ["React", "Angular", "Django", "PostgreSQL", "Cypress", "Leaflet"]
  },
  Binbooker: {
    summary:
      "Improved key product areas and operational workflows for a waste management SaaS platform.",
    techStack: ["React", "SCSS", "Stripe", "Node.js"]
  },
  "Evelan GmbH": {
    summary:
      "Developed core features for an enterprise document and holdings management system used by family offices.",
    techStack: ["React", "Next.js", "tRPC", "Prisma", "PostgreSQL", "Chakra UI", "Zod", "Jest"]
  },
  "Beyonder Inc.": {
    summary:
      "Led frontend development and delivered multiple web and mobile applications for diverse clients across Japan.",
    techStack: ["React", "React Native", "Node.js", "Tailwind CSS", "Figma", "GitHub Actions"]
  },
  Gig: {
    summary:
      "Collaborated on a small team delivering web applications for small businesses, from design prototyping to production.",
    techStack: ["React", "Next.js", "TypeScript", "Firebase", "Figma"]
  }
};

function enrichExperience(exp: Experience): Experience {
  if (exp.summary && exp.techStack?.length) return exp;
  const defaults = timelineDefaults[exp.company];
  if (!defaults) return exp;
  return {
    ...exp,
    summary: exp.summary || defaults.summary,
    techStack: exp.techStack?.length ? exp.techStack : defaults.techStack
  };
}

export async function getExperience(): Promise<Experience[]> {
  try {
    const experiences = await getSanityClient().fetch<Experience[]>(
      `*[_type == "experience"] | order(order desc) {
        _id,
        title,
        company,
        companyWebsite,
        location,
        range,
        summary,
        techStack,
        duties,
        order
      }`,
      {},
      {
        // Revalidate every 60 seconds
        next: { revalidate: 60 }
      }
    );

    // If no data in Sanity, return fallback
    if (experiences.length === 0) {
      return fallbackExperience;
    }

    return experiences.map(enrichExperience);
  } catch (error) {
    log.warn("Error fetching experience from Sanity, using fallback", {
      error: error instanceof Error ? error.message : String(error)
    });
    return fallbackExperience;
  }
}
