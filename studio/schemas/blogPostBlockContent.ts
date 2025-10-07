import { defineArrayMember, defineType } from 'sanity';

/**
 * This is the schema definition for the rich text fields used for
 * blog post content with support for code blocks
 */
export default defineType({
  title: 'Blog Post Block Content',
  name: 'blogPostBlockContent',
  type: 'array',
  of: [
    defineArrayMember({
      title: 'Block',
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H1', value: 'h1' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
        { title: 'Quote', value: 'blockquote' }
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' }
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
          { title: 'Code', value: 'code' }
        ],
        annotations: [
          {
            title: 'URL',
            name: 'link',
            type: 'object',
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
                validation: (Rule) =>
                  Rule.uri({
                    scheme: ['http', 'https', 'mailto', 'tel']
                  })
              }
            ]
          }
        ]
      }
    }),
    // Code block support
    defineArrayMember({
      type: 'object',
      name: 'codeBlock',
      title: 'Code Block',
      fields: [
        {
          name: 'language',
          title: 'Language',
          type: 'string',
          options: {
            list: [
              { title: 'JavaScript', value: 'javascript' },
              { title: 'TypeScript', value: 'typescript' },
              { title: 'JSX', value: 'jsx' },
              { title: 'TSX', value: 'tsx' },
              { title: 'HTML', value: 'html' },
              { title: 'CSS', value: 'css' },
              { title: 'SCSS', value: 'scss' },
              { title: 'JSON', value: 'json' },
              { title: 'Python', value: 'python' },
              { title: 'Bash', value: 'bash' },
              { title: 'Shell', value: 'shell' },
              { title: 'SQL', value: 'sql' },
              { title: 'GraphQL', value: 'graphql' },
              { title: 'Markdown', value: 'markdown' },
              { title: 'YAML', value: 'yaml' },
              { title: 'Go', value: 'go' },
              { title: 'Rust', value: 'rust' },
              { title: 'Java', value: 'java' },
              { title: 'C', value: 'c' },
              { title: 'C++', value: 'cpp' },
              { title: 'C#', value: 'csharp' },
              { title: 'PHP', value: 'php' },
              { title: 'Ruby', value: 'ruby' },
              { title: 'Swift', value: 'swift' },
              { title: 'Kotlin', value: 'kotlin' },
              { title: 'Dart', value: 'dart' },
              { title: 'Elixir', value: 'elixir' },
              { title: 'R', value: 'r' },
              { title: 'Scala', value: 'scala' },
              { title: 'Haskell', value: 'haskell' },
              { title: 'Dockerfile', value: 'dockerfile' },
              { title: 'XML', value: 'xml' },
              { title: 'TOML', value: 'toml' },
              { title: 'INI', value: 'ini' },
              { title: 'Text', value: 'text' }
            ]
          },
          initialValue: 'javascript'
        },
        {
          name: 'filename',
          title: 'Filename',
          type: 'string',
          description: 'Optional filename to display'
        },
        {
          name: 'code',
          title: 'Code',
          type: 'text',
          rows: 10
        }
      ]
    })
  ]
});
