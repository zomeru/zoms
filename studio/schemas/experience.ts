import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'experience',
  title: 'Experience',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Job Title',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'company',
      title: 'Company Name',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'range',
      title: 'Duration',
      type: 'string',
      description: 'e.g., "Jan. 2024 - Present"',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'duties',
      title: 'Responsibilities',
      type: 'array',
      of: [{ type: 'text' }],
      description: 'List of job responsibilities and achievements'
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Used to order experience entries (lower numbers appear first)',
      validation: (Rule) => Rule.required().integer().min(0)
    })
  ],
  preview: {
    select: {
      title: 'title',
      company: 'company',
      range: 'range',
      order: 'order'
    },
    prepare(selection: { title: string; company: string; range: string; order: number }) {
      const { title, company, range, order } = selection;
      return {
        title: `${title} · ${company}`,
        subtitle: `${range} (Order: ${order})`
      };
    }
  },
  orderings: [
    {
      title: 'Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }]
    }
  ]
});
