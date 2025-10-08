import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) =>
        Rule.required().max(100).warning('Titles should be under 100 characters')
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      validation: (Rule) =>
        Rule.required().max(300).warning('Summaries should be under 300 characters for SEO')
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blogPostBlockContent',
      validation: (Rule) => Rule.required(),
      hidden: ({ document }) => !!document?.bodyMarkdown
    }),
    defineField({
      name: 'bodyMarkdown',
      title: 'Body (Markdown)',
      type: 'text',
      rows: 20,
      description:
        'Blog content in Markdown format. When provided, this takes precedence over the block content.',
      hidden: ({ document }) => !!document?.body && !document?.bodyMarkdown
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'modifiedAt',
      title: 'Modified At',
      type: 'datetime',
      description: 'Last modified date (optional, defaults to publishedAt if not set)'
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags'
      }
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      description: 'Source of the content (e.g., "automated/gemini", "manual")',
      options: {
        list: [
          { title: 'Manual', value: 'manual' },
          { title: 'Automated/Gemini', value: 'automated/gemini' }
        ]
      }
    }),
    defineField({
      name: 'generated',
      title: 'Generated',
      type: 'boolean',
      description: 'Whether this post was auto-generated',
      initialValue: false
    }),
    defineField({
      name: 'readTime',
      title: 'Read Time',
      type: 'number',
      description: 'Estimated read time in minutes (AI-generated)',
      validation: (Rule) => Rule.min(1).max(60)
    })
  ],
  preview: {
    select: {
      title: 'title',
      publishedAt: 'publishedAt',
      generated: 'generated'
    },
    prepare(selection: Record<string, string | boolean>) {
      const { title, publishedAt, generated } = selection;
      const date = publishedAt ? new Date(publishedAt as string).toLocaleDateString() : 'No date';
      const badge = generated ? '🤖' : '✍️';
      return {
        title: `${badge} ${title}`,
        subtitle: date
      };
    }
  },
  orderings: [
    {
      title: 'Published Date, Newest',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }]
    },
    {
      title: 'Published Date, Oldest',
      name: 'publishedAtAsc',
      by: [{ field: 'publishedAt', direction: 'asc' }]
    }
  ]
});
