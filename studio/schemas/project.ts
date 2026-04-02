import { defineField, defineType } from "sanity";

export default defineType({
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: "image",
      title: "Image Filename",
      type: "string",
      description: 'Filename in public/assets/images/projects, e.g. "project-batibot.jpg"',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: "alt",
      title: "Image Alt Text",
      type: "string",
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: "info",
      title: "Description",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: "techs",
      title: "Tech Stack",
      type: "array",
      of: [{ type: "string" }],
      validation: (Rule) => Rule.required().min(1)
    }),
    defineField({
      name: "demoUrl",
      title: "Demo URL",
      type: "url",
      validation: (Rule) => Rule.required().uri({ scheme: ["http", "https"] })
    }),
    defineField({
      name: "githubUrl",
      title: "GitHub URL",
      type: "url",
      validation: (Rule) => Rule.required().uri({ scheme: ["http", "https"] })
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description: "Used to order project entries (higher numbers appear first)",
      validation: (Rule) => Rule.required().integer().min(0)
    })
  ],
  preview: {
    select: {
      name: "name",
      order: "order"
    },
    prepare(selection: Record<string, string | number>) {
      const { name, order } = selection;
      return {
        title: String(name),
        subtitle: `Order: ${String(order)}`
      };
    }
  },
  orderings: [
    {
      title: "Order",
      name: "orderDesc",
      by: [{ field: "order", direction: "desc" }]
    }
  ]
});
