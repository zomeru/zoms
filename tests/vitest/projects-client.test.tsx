// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ProjectsClient from '@/components/sections/ProjectsClient';

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt} />
}));

const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');
const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight');
const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
const originalScrollWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth');

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.getAttribute('data-testid') === 'project-description-Expandable Description'
        ? 72
        : 120;
    }
  });

  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.getAttribute('data-testid') === 'project-description-Expandable Description'
        ? 144
        : 120;
    }
  });

  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return this.getAttribute('data-testid') === 'project-tech-stack-Expandable Stack' ? 200 : 400;
    }
  });

  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return this.getAttribute('data-testid') === 'project-tech-stack-Expandable Stack' ? 480 : 400;
    }
  });
});

afterEach(() => {
  if (originalClientHeight) {
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', originalClientHeight);
  }

  if (originalScrollHeight) {
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', originalScrollHeight);
  }

  if (originalClientWidth) {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalClientWidth);
  }

  if (originalScrollWidth) {
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', originalScrollWidth);
  }
});

describe('projects client cards', () => {
  it('renders the full tech stack for each project card', () => {
    render(
      <ProjectsClient
        projects={[
          {
            alt: 'Project screenshot',
            image: 'project.png',
            info: 'A project with a large stack.',
            links: {
              demo: 'https://example.com/demo',
              github: 'https://example.com/repo'
            },
            name: 'Stacked Project',
            order: 10,
            techs: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Prisma', 'PostgreSQL', 'Sanity']
          }
        ]}
      />
    );

    expect(screen.getByText('Next.js')).toBeTruthy();
    expect(screen.getByText('TypeScript')).toBeTruthy();
    expect(screen.getByText('Tailwind CSS')).toBeTruthy();
    expect(screen.getByText('Prisma')).toBeTruthy();
    expect(screen.getByText('PostgreSQL')).toBeTruthy();
    expect(screen.getByText('Sanity')).toBeTruthy();
    expect(screen.queryByText('+2')).toBeNull();
  });

  it('clamps the description to three lines until expanded', async () => {
    render(
      <ProjectsClient
        projects={[
          {
            alt: 'Project screenshot',
            image: 'project.png',
            info: 'Sentence one. Sentence two. Sentence three. Sentence four. Sentence five. Sentence six.',
            links: {
              demo: 'https://example.com/demo',
              github: 'https://example.com/repo'
            },
            name: 'Expandable Description',
            order: 10,
            techs: ['Next.js', 'TypeScript', 'Tailwind CSS']
          }
        ]}
      />
    );

    const description = screen.getByText(
      'Sentence one. Sentence two. Sentence three. Sentence four. Sentence five. Sentence six.'
    );

    expect(description.className).toContain('line-clamp-3');

    return await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Show full description' }));
      expect(description.className).not.toContain('line-clamp-3');
      expect(screen.getByRole('button', { name: 'Collapse description' })).toBeTruthy();
    });
  });

  it('hides the description toggle when the text fits inside three lines', () => {
    render(
      <ProjectsClient
        projects={[
          {
            alt: 'Project screenshot',
            image: 'project.png',
            info: 'A short summary.',
            links: {
              demo: 'https://example.com/demo',
              github: 'https://example.com/repo'
            },
            name: 'Short Description',
            order: 10,
            techs: ['Next.js', 'TypeScript', 'Tailwind CSS']
          }
        ]}
      />
    );

    expect(screen.queryByRole('button', { name: 'Show full description' })).toBeNull();
  });

  it('shows a single tech stack row until expanded', async () => {
    render(
      <ProjectsClient
        projects={[
          {
            alt: 'Project screenshot',
            image: 'project.png',
            info: 'A project with a large stack.',
            links: {
              demo: 'https://example.com/demo',
              github: 'https://example.com/repo'
            },
            name: 'Expandable Stack',
            order: 10,
            techs: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Prisma', 'PostgreSQL', 'Sanity']
          }
        ]}
      />
    );

    const stack = screen.getByTestId('project-tech-stack-Expandable Stack');

    expect(stack.className).toContain('whitespace-nowrap');
    expect(stack.className).toContain('overflow-hidden');
    expect(screen.queryByText('expand stack')).toBeNull();

    return await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Show full tech stack' }));
      expect(stack.className).toContain('flex-wrap');
      expect(stack.className).not.toContain('flex-nowrap');
      expect(screen.getByRole('button', { name: 'Collapse tech stack' })).toBeTruthy();
    });
  });
});
