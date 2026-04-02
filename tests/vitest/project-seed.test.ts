import { describe, expect, it } from "vitest";

describe("Sanity project seed helpers", () => {
  it("builds descending order values and preserves existing ids matched by name", async () => {
    const { buildProjectSeedDocuments } = await import("@/lib/sanity-project-seed");

    const documents = buildProjectSeedDocuments([
      {
        _id: "existing-groundwork-id",
        name: "Groundwork PH"
      },
      {
        _id: "existing-zomify-colors-id",
        name: "Zomify Colors"
      }
    ]);

    const batibot = documents.find((document) => document.name === "Batibot");
    const zomink = documents.find((document) => document.name === "Zomink");
    const groundwork = documents.find((document) => document.name === "Groundwork PH");
    const zomifyColors = documents.find((document) => document.name === "Zomify Colors");

    expect(documents).toHaveLength(9);
    expect(batibot?.order).toBeGreaterThan(zomink?.order ?? -1);
    expect(groundwork?._id).toBe("existing-groundwork-id");
    expect(zomifyColors?._id).toBe("existing-zomify-colors-id");
  });

  it("assigns stable generated ids for projects that do not already exist in Sanity", async () => {
    const { buildProjectSeedDocuments } = await import("@/lib/sanity-project-seed");

    const documents = buildProjectSeedDocuments([]);
    const batibot = documents.find((document) => document.name === "Batibot");

    expect(batibot?._id).toBe("project-batibot");
  });

  it("migrates legacy seeded ids that used the dot-delimited format", async () => {
    const { buildProjectSeedDocuments } = await import("@/lib/sanity-project-seed");

    const documents = buildProjectSeedDocuments([
      {
        _id: "project.batibot",
        name: "Batibot"
      }
    ]);
    const batibot = documents.find((document) => document.name === "Batibot");

    expect(batibot?._id).toBe("project-batibot");
  });
});
