// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectsClient } from "@/components/sections/ProjectsClient";

vi.mock("next/image", () => ({
  // biome-ignore lint/performance/noImgElement: jsdom tests mock next/image with a plain img to keep assertions simple.
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt} />
}));

const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");
const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
const originalScrollWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollWidth");

function restorePropertyDescriptor(
  property: "clientHeight" | "scrollHeight" | "clientWidth" | "scrollWidth",
  descriptor: PropertyDescriptor | undefined
): void {
  if (descriptor) {
    Object.defineProperty(HTMLElement.prototype, property, descriptor);
    return;
  }

  Reflect.deleteProperty(HTMLElement.prototype, property);
}

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return this.getAttribute("data-testid") === "project-description-Expandable Description"
        ? 72
        : 120;
    }
  });

  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return this.getAttribute("data-testid") === "project-description-Expandable Description"
        ? 144
        : 120;
    }
  });

  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get(this: HTMLElement) {
      return this.getAttribute("data-testid") === "project-tech-stack-Expandable Stack" ? 200 : 400;
    }
  });

  Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
    configurable: true,
    get(this: HTMLElement) {
      return this.getAttribute("data-testid") === "project-tech-stack-Expandable Stack" ? 480 : 400;
    }
  });
});

afterEach(() => {
  restorePropertyDescriptor("clientHeight", originalClientHeight);
  restorePropertyDescriptor("scrollHeight", originalScrollHeight);
  restorePropertyDescriptor("clientWidth", originalClientWidth);
  restorePropertyDescriptor("scrollWidth", originalScrollWidth);
});

describe("projects client cards", () => {
  it("renders the full tech stack for each project card", () => {
    render(
      <ProjectsClient
        projects={[
          {
            alt: "Project screenshot",
            image: "project.png",
            info: "A project with a large stack.",
            links: {
              demo: "https://example.com/demo",
              github: "https://example.com/repo"
            },
            name: "Stacked Project",
            order: 10,
            techs: ["Next.js", "TypeScript", "Tailwind CSS", "Prisma", "PostgreSQL", "Sanity"]
          }
        ]}
      />
    );

    expect(screen.getByText("Next.js")).toBeTruthy();
    expect(screen.getByText("TypeScript")).toBeTruthy();
    expect(screen.getByText("Tailwind CSS")).toBeTruthy();
    expect(screen.getByText("Prisma")).toBeTruthy();
    expect(screen.getByText("PostgreSQL")).toBeTruthy();
    expect(screen.getByText("Sanity")).toBeTruthy();
    expect(screen.queryByText("+2")).toBeNull();
  });

  it("clamps the description to three lines until expanded", async () => {
    render(
      <ProjectsClient
        projects={[
          {
            alt: "Project screenshot",
            image: "project.png",
            info: "Sentence one. Sentence two. Sentence three. Sentence four. Sentence five. Sentence six.",
            links: {
              demo: "https://example.com/demo",
              github: "https://example.com/repo"
            },
            name: "Expandable Description",
            order: 10,
            techs: ["Next.js", "TypeScript", "Tailwind CSS"]
          }
        ]}
      />
    );

    const description = screen.getByText(
      "Sentence one. Sentence two. Sentence three. Sentence four. Sentence five. Sentence six."
    );
    const toggleButton = await screen.findByRole("button", { name: /read more/i });

    expect(description.className).toContain("line-clamp-3");
    expect(toggleButton).toBeTruthy();

    fireEvent.click(toggleButton);

    return await waitFor(() => {
      expect(description.className).not.toContain("line-clamp-3");
      expect(screen.getByText(/collapse/i).closest("button")).toBeTruthy();
    });
  }, 10000);

  it("hides the description toggle when the text fits inside three lines", () => {
    render(
      <ProjectsClient
        projects={[
          {
            alt: "Project screenshot",
            image: "project.png",
            info: "A short summary.",
            links: {
              demo: "https://example.com/demo",
              github: "https://example.com/repo"
            },
            name: "Short Description",
            order: 10,
            techs: ["Next.js", "TypeScript", "Tailwind CSS"]
          }
        ]}
      />
    );

    expect(screen.queryByRole("button", { name: /description/i })).toBeNull();
  });

  it("shows a single tech stack row until expanded", async () => {
    render(
      <ProjectsClient
        projects={[
          {
            alt: "Project screenshot",
            image: "project.png",
            info: "A project with a large stack.",
            links: {
              demo: "https://example.com/demo",
              github: "https://example.com/repo"
            },
            name: "Expandable Stack",
            order: 10,
            techs: ["Next.js", "TypeScript", "Tailwind CSS", "Prisma", "PostgreSQL", "Sanity"]
          }
        ]}
      />
    );

    const stack = screen.getByTestId("project-tech-stack-Expandable Stack");

    expect(stack.className).toContain("whitespace-nowrap");
    expect(stack.className).toContain("overflow-hidden");

    const toggleButton = await screen.findByRole("button", { name: "Show full tech stack" });
    fireEvent.click(toggleButton);

    return await waitFor(() => {
      expect(stack.className).toContain("flex-wrap");
      expect(stack.className).not.toContain("flex-nowrap");
      expect(screen.getByRole("button", { name: "Collapse tech stack" })).toBeTruthy();
    });
  });
});
