import {
  PortableText,
  type PortableTextComponents,
  type PortableTextMarkComponentProps
} from '@portabletext/react';
import type React from 'react';

import { TerminalCard } from '@/components/ui';

interface LinkValue {
  _type: string;
  href?: string;
}

const portableTextComponents: PortableTextComponents = {
  marks: {
    link: ({ value, children }: PortableTextMarkComponentProps<LinkValue>) => {
      const href = value?.href;
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {children}
        </a>
      );
    },
    strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>
  },
  block: {
    normal: ({ children }) => <p className="mb-2 text-sm text-text-secondary">{children}</p>
  },
  list: {
    bullet: ({ children }) => <>{children}</>,
    number: ({ children }) => <>{children}</>
  },
  listItem: {
    bullet: ({ children }) => (
      <p className="mb-1 text-sm text-text-secondary">
        <span className="text-primary">›</span> {children}
      </p>
    ),
    number: ({ children, index }) => (
      <p className="mb-1 text-sm text-text-secondary">
        <span className="text-primary">{index + 1}.</span> {children}
      </p>
    )
  }
};

const Experience: React.FC = async (): Promise<React.JSX.Element> => {
  const { getExperience } = await import('@/lib/experience');
  const experience = await getExperience();

  return (
    <section id="experience" className="pb-20">
      <h2 className="section-title">Experience</h2>

      <div className="space-y-6">
        {experience.map(({ title, company, companyWebsite, location, range, duties }) => {
          const id =
            title.replaceAll(' ', '-').toLowerCase() +
            '-' +
            company.replaceAll(' ', '-').toLowerCase();

          return (
            <TerminalCard
              key={id}
              title={`${company.toLowerCase().replace(/\s+/g, '-')}.log`}
              showHeader={true}
              className="transition-colors hover:border-border-hover"
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-medium text-terminal-green">{title}</span>
                    <span className="text-text-muted"> @ </span>
                    {companyWebsite ? (
                      <a
                        href={companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-terminal-purple hover:underline"
                      >
                        {company}
                      </a>
                    ) : (
                      <span className="text-terminal-purple">{company}</span>
                    )}
                  </div>
                  <span className="font-mono text-text-muted text-xs">{range}</span>
                </div>
                <div className="text-text-muted text-xs">
                  <span className="text-terminal-yellow">location:</span> {location}
                </div>
                <div className="mt-2 border-code-border border-t pt-3">
                  <div className="mb-2 font-mono text-text-muted text-xs">duties:</div>
                  <PortableText value={duties} components={portableTextComponents} />
                </div>
              </div>
            </TerminalCard>
          );
        })}
      </div>

      <div className="mt-8">
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
