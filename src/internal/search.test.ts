import { describe, expect, it } from 'vitest'
import * as Config from './config.js'
import * as Search from './search.js'
import { type SearchDocuments, SearchIndex } from './search.js'

const config = Config.define()

describe('Search.extract', () => {
  it('bails early when searchPriority is 0', () => {
    const content = `---
title: My Page
searchPriority: 0
---

# Content

This should not be indexed.
`
    const { searchPriority, sections } = Search.extract(content, config)
    expect(searchPriority).toBe(0)
    expect(sections).toMatchInlineSnapshot(`[]`)
  })

  it('extracts searchPriority from frontmatter', () => {
    const content = `---
title: My Page
searchPriority: 5
---

# Heading

Some text.
`
    const { searchPriority, sections } = Search.extract(content, config)
    expect(searchPriority).toBe(5)
    expect(sections.length).toBe(1)
  })

  it('extracts sections from headings', () => {
    const content = `
# Getting Started

This is the intro paragraph.

## Installation

Run the install command.

### npm

Use npm to install.

## Usage

Here is how to use it.
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "getting-started",
          "isPage": true,
          "subtitle": "",
          "text": " This is the intro paragraph.",
          "title": "Getting Started",
          "titles": [],
        },
        {
          "anchor": "installation",
          "isPage": false,
          "subtitle": "",
          "text": " Run the install command.",
          "title": "Installation",
          "titles": [
            "Getting Started",
          ],
        },
        {
          "anchor": "npm",
          "isPage": false,
          "subtitle": "",
          "text": " Use npm to install.",
          "title": "npm",
          "titles": [
            "Getting Started",
            "Installation",
          ],
        },
        {
          "anchor": "usage",
          "isPage": false,
          "subtitle": "",
          "text": " Here is how to use it.",
          "title": "Usage",
          "titles": [
            "Getting Started",
          ],
        },
      ]
    `)
  })

  it('handles all heading levels (h1-h6)', () => {
    const content = `
# Heading 1

Content 1.

## Heading 2

Content 2.

### Heading 3

Content 3.

#### Heading 4

Content 4.

##### Heading 5

Content 5.

###### Heading 6

Content 6.
`
    const sections = Search.extract(content, config).sections
    expect(sections.map((s) => ({ title: s.title, titles: s.titles }))).toMatchInlineSnapshot(`
      [
        {
          "title": "Heading 1",
          "titles": [],
        },
        {
          "title": "Heading 2",
          "titles": [
            "Heading 1",
          ],
        },
        {
          "title": "Heading 3",
          "titles": [
            "Heading 1",
            "Heading 2",
          ],
        },
        {
          "title": "Heading 4",
          "titles": [
            "Heading 1",
            "Heading 2",
            "Heading 3",
          ],
        },
        {
          "title": "Heading 5",
          "titles": [
            "Heading 1",
            "Heading 2",
            "Heading 3",
            "Heading 4",
          ],
        },
        {
          "title": "Heading 6",
          "titles": [
            "Heading 1",
            "Heading 2",
            "Heading 3",
            "Heading 4",
            "Heading 5",
          ],
        },
      ]
    `)
  })

  it('handles blockquotes', () => {
    const content = `
# Blockquotes

> This is a quote.
> Multiple lines.

> Another quote with *emphasis*.
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "blockquotes",
          "isPage": true,
          "subtitle": "",
          "text": " This is a quote.
      Multiple lines. Another quote with emphasis.",
          "title": "Blockquotes",
          "titles": [],
        },
      ]
    `)
  })

  it('handles code blocks with meta (titles, line numbers)', () => {
    const content = `
# Code

\`\`\`ts [example.ts]
const x = 1
\`\`\`

\`\`\`bash [Terminal]
npm install
\`\`\`
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "code",
          "isPage": true,
          "subtitle": "",
          "text": " const x = 1 npm install",
          "title": "Code",
          "titles": [],
        },
      ]
    `)
  })

  it('handles code groups', () => {
    const content = `
# Installation

:::code-group

\`\`\`bash [npm]
npm i viem
\`\`\`

\`\`\`bash [pnpm]
pnpm i viem
\`\`\`

:::
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "installation",
          "isPage": true,
          "subtitle": "",
          "text": " npm i viem pnpm i viem",
          "title": "Installation",
          "titles": [],
        },
      ]
    `)
  })

  it('handles consecutive headings with no content between', () => {
    const content = `
# Main

## Empty Section

## Another Empty

## Has Content

Finally some text.
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "main",
          "isPage": true,
          "subtitle": "",
          "text": " Finally some text.",
          "title": "Main",
          "titles": [],
        },
        {
          "anchor": "has-content",
          "isPage": false,
          "subtitle": "",
          "text": " Finally some text.",
          "title": "Has Content",
          "titles": [
            "Main",
          ],
        },
      ]
    `)
  })

  it('handles content with no headings', () => {
    const content = `Just some text without headings.`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`[]`)
  })

  it('handles directive callouts', () => {
    const content = `
# Callouts

:::note
This is a note.
:::

:::warning
This is a warning.
:::
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "callouts",
          "isPage": true,
          "subtitle": "",
          "text": " This is a note. This is a warning.",
          "title": "Callouts",
          "titles": [],
        },
      ]
    `)
  })

  it('handles duplicate heading text (generates unique anchors)', () => {
    const content = `
# Example

First example.

## Example

Second example.

## Example

Third example.
`
    const sections = Search.extract(content, config).sections
    expect(sections.map((s) => s.anchor)).toMatchInlineSnapshot(`
      [
        "example",
        "example-1",
        "example-2",
      ]
    `)
  })

  it('handles emphasis (bold, italic, strikethrough)', () => {
    const content = `
# Emphasis

*italics* and _underscores_.

**bold** and __double underscores__.

~~strikethrough~~
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "emphasis",
          "isPage": true,
          "subtitle": "",
          "text": " italics and underscores. bold and double underscores. strikethrough",
          "title": "Emphasis",
          "titles": [],
        },
      ]
    `)
  })

  it('handles empty content', () => {
    expect(Search.extract('', config).sections).toMatchInlineSnapshot(`[]`)
  })

  it('handles footnotes', () => {
    const content = `
# Footnotes

Here is a footnote[^1].

[^1]: My reference.
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "footnotes",
          "isPage": true,
          "subtitle": "",
          "text": " Here is a footnote. My reference.",
          "title": "Footnotes",
          "titles": [],
        },
      ]
    `)
  })

  it('handles horizontal rules', () => {
    const content = `
# Section One

Content before.

---

Content after.

## Section Two

More content.
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "section-one",
          "isPage": true,
          "subtitle": "",
          "text": " Content before. Content after.",
          "title": "Section One",
          "titles": [],
        },
        {
          "anchor": "section-two",
          "isPage": false,
          "subtitle": "",
          "text": " More content.",
          "title": "Section Two",
          "titles": [
            "Section One",
          ],
        },
      ]
    `)
  })

  it('handles images', () => {
    const content = `
# Images

![alt text](https://example.com/image.png "Title")

![reference][logo]

[logo]: https://example.com/logo.png
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "images",
          "isPage": true,
          "subtitle": "",
          "text": " alt text reference",
          "title": "Images",
          "titles": [],
        },
      ]
    `)
  })

  it('handles inline code', () => {
    const content = `
# API

Use the \`createUser\` function.
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "api",
          "isPage": true,
          "subtitle": "",
          "text": " Use the createUser function.",
          "title": "API",
          "titles": [],
        },
      ]
    `)
  })

  it('handles inline HTML/JSX elements', () => {
    const content = `
# HTML

<div className="custom">
  Hello world!
</div>

Regular text after.
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "html",
          "isPage": true,
          "subtitle": "",
          "text": " Hello world! Regular text after.",
          "title": "HTML",
          "titles": [],
        },
      ]
    `)
  })

  it('handles links (inline, reference-style)', () => {
    const content = `
# Links

[inline link](https://example.com)

[reference link][ref]

[ref]: https://example.com
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "links",
          "isPage": true,
          "subtitle": "",
          "text": " inline link reference link",
          "title": "Links",
          "titles": [],
        },
      ]
    `)
  })

  it('handles lists (ordered, unordered, nested)', () => {
    const content = `
# Lists

1. First item
2. Second item
   - Nested unordered
   - Another nested
3. Third item

* Unordered first
* Unordered second
  * Nested item
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "lists",
          "isPage": true,
          "subtitle": "",
          "text": " First itemSecond itemNested unorderedAnother nestedThird item Unordered firstUnordered secondNested item",
          "title": "Lists",
          "titles": [],
        },
      ]
    `)
  })

  it('handles mixed content from kitchen sink', () => {
    const content = `import { Example } from '../components/Example'

# Kitchen Sink [An MDX Playground]

This is a kitchen sink page.

## Code and Syntax

Inline \`code\` has back-ticks.

\`\`\`ts [example.ts]
type Example = string
const example: Example = 'example'
\`\`\`

:::tip[Tip]
Make sure to do the thing.

\`\`\`tsx
const x = 1
\`\`\`
:::

## Tables

| Method | Description |
| ------ | ----------- |
| \`get\` | Gets data |
| \`set\` | Sets data |
`
    const sections = Search.extract(content, config).sections
    expect(
      sections.map((s) => ({ title: s.title, textPreview: s.text.slice(0, 50) })),
    ).toMatchInlineSnapshot(`
      [
        {
          "textPreview": " This is a kitchen sink page.",
          "title": "Kitchen Sink",
        },
        {
          "textPreview": " Inline code has back-ticks. type Example = string",
          "title": "Code and Syntax",
        },
        {
          "textPreview": " MethodDescriptiongetGets datasetSets data",
          "title": "Tables",
        },
      ]
    `)
  })

  it('handles nested directives', () => {
    const content = `
# Nested

::::note
:::details[See more]
Hidden content here.
:::
::::
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "nested",
          "isPage": true,
          "subtitle": "",
          "text": " See more Hidden content here.",
          "title": "Nested",
          "titles": [],
        },
      ]
    `)
  })

  it('handles steps directive', () => {
    const content = `
# Getting Started

::::steps
### Step one

Do this first.

### Step two

Then do this.
::::
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "getting-started",
          "isPage": true,
          "subtitle": "",
          "text": " Do this first.",
          "title": "Getting Started",
          "titles": [],
        },
        {
          "anchor": "step-one",
          "isPage": false,
          "subtitle": "",
          "text": " Do this first.",
          "title": "Step one",
          "titles": [
            "Getting Started",
            undefined,
          ],
        },
        {
          "anchor": "step-two",
          "isPage": false,
          "subtitle": "",
          "text": " Then do this.",
          "title": "Step two",
          "titles": [
            "Getting Started",
            undefined,
          ],
        },
      ]
    `)
  })

  it('handles tables', () => {
    const content = `
# Tables

| Method | Description | Returns |
| ------ | ----------- | ------: |
| \`getBalance\` | Returns balance | \`bigint\` |
| \`getBlock\` | Returns block info | \`Block\` |
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "tables",
          "isPage": true,
          "subtitle": "",
          "text": " MethodDescriptionReturnsgetBalanceReturns balancebigintgetBlockReturns block infoBlock",
          "title": "Tables",
          "titles": [],
        },
      ]
    `)
  })

  it('handles tasklists', () => {
    const content = `
# Tasks

* [ ] Todo item
* [x] Done item
* [ ] Another todo
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "tasks",
          "isPage": true,
          "subtitle": "",
          "text": " Todo itemDone itemAnother todo",
          "title": "Tasks",
          "titles": [],
        },
      ]
    `)
  })

  it('handles title with description syntax', () => {
    const content = `
# My Title [This is the description]

Some content.
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "my-title",
          "isPage": true,
          "subtitle": "This is the description",
          "text": " Some content.",
          "title": "My Title",
          "titles": [],
        },
      ]
    `)
  })

  it('includes JSX text content', () => {
    const content = `
# Title

Some text before.

<Callout>
This should be included.
</Callout>

Some text after.
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "title",
          "isPage": true,
          "subtitle": "",
          "text": " Some text before. This should be included. Some text after.",
          "title": "Title",
          "titles": [],
        },
      ]
    `)
  })

  it('includes code block content', () => {
    const content = `
# Code Example

Here is some code:

\`\`\`ts
const x = 1
\`\`\`
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "code-example",
          "isPage": true,
          "subtitle": "",
          "text": " Here is some code: const x = 1",
          "title": "Code Example",
          "titles": [],
        },
      ]
    `)
  })

  it('skips imports at the top of MDX files', () => {
    const content = `import { Example } from '../components/Example'
import { useState } from 'react'

# Title

Some content here.
`
    expect(Search.extract(content, config).sections).toMatchInlineSnapshot(`
      [
        {
          "anchor": "title",
          "isPage": true,
          "subtitle": "",
          "text": " Some content here.",
          "title": "Title",
          "titles": [],
        },
      ]
    `)
  })
})

describe('Search fields and storeFields', () => {
  it('exports search fields', () => {
    expect(Search.searchFields).toMatchInlineSnapshot(`
      [
        "category",
        "subtitle",
        "text",
        "title",
        "titles",
      ]
    `)
  })

  it('exports store fields', () => {
    expect(Search.storeFields).toMatchInlineSnapshot(`
      [
        "category",
        "href",
        "isPage",
        "searchPriority",
        "subtitle",
        "text",
        "title",
        "titles",
      ]
    `)
  })
})

describe('Config.search defaults', () => {
  it('returns search configuration with defaults', () => {
    expect(config.search.boost).toMatchInlineSnapshot(`
      {
        "category": 1,
        "subtitle": 3,
        "text": 2,
        "title": 4,
        "titles": 1,
      }
    `)
    expect(config.search.fuzzy).toBe(0.2)
    expect(config.search.prefix).toBe(true)
    expect(typeof config.search.boostDocument).toBe('function')
  })
})

describe('Search.tokenize', () => {
  it('filters empty tokens', () => {
    expect(Search.tokenize('  hello   world  ')).toEqual(['hello', 'world'])
  })

  it('handles acronyms and keeps original', () => {
    expect(Search.tokenize('getHTTPResponse')).toEqual([
      'gethttpresponse',
      'get',
      'http',
      'response',
    ])
    expect(Search.tokenize('parseJSON')).toEqual(['parsejson', 'parse', 'json'])
  })

  it('lowercases all tokens', () => {
    expect(Search.tokenize('Hello WORLD')).toEqual(['hello', 'world'])
  })

  it('splits camelCase and keeps original', () => {
    expect(Search.tokenize('createUser')).toEqual(['createuser', 'create', 'user'])
    expect(Search.tokenize('getUserById')).toEqual(['getuserbyid', 'get', 'user', 'by', 'id'])
  })

  it('splits on common separators', () => {
    expect(Search.tokenize('foo-bar')).toEqual(['foo', 'bar'])
    expect(Search.tokenize('foo_bar')).toEqual(['foo', 'bar'])
    expect(Search.tokenize('foo.bar')).toEqual(['foo', 'bar'])
    expect(Search.tokenize('foo/bar')).toEqual(['foo', 'bar'])
  })

  it('strips @ symbol', () => {
    expect(Search.tokenize('@noErrors')).toEqual(['noerrors', 'no', 'errors'])
    expect(Search.tokenize('@noErr')).toEqual(['noerr', 'no', 'err'])
    expect(Search.tokenize('@shikijs/twoslash')).toEqual(['shikijs', 'twoslash'])
  })

  it('splits on whitespace', () => {
    expect(Search.tokenize('hello world')).toEqual(['hello', 'world'])
  })

  it('splits PascalCase and keeps original', () => {
    expect(Search.tokenize('CreateUser')).toEqual(['createuser', 'create', 'user'])
    expect(Search.tokenize('TypeScript')).toEqual(['typescript', 'type', 'script'])
  })
})

describe('SearchIndex.fromSearchDocuments', () => {
  function buildDoc(id: string, href: string, content: string): SearchDocuments.Document[] {
    const { searchPriority, sections } = Search.extract(content, config)
    return sections.map((section) => ({
      category: '',
      href: section.anchor ? `${href}#${section.anchor}` : href,
      id: `${id}#${section.anchor}`,
      isPage: section.isPage,
      searchPriority,
      subtitle: section.subtitle,
      text: section.text,
      title: section.title,
      titles: section.titles,
    }))
  }

  it('boosts documents with higher searchPriority', () => {
    const lowPriorityDoc: SearchDocuments.Document = {
      category: '',
      href: '/config#configuration',
      id: '/docs/config.mdx#configuration',
      isPage: true,
      searchPriority: 1,
      subtitle: '',
      text: ' Config setup guide.',
      title: 'Configuration',
      titles: [],
    }

    const highPriorityDoc: SearchDocuments.Document = {
      category: '',
      href: '/advanced#configuration',
      id: '/docs/advanced.mdx#configuration',
      isPage: true,
      searchPriority: 10,
      subtitle: '',
      text: ' Advanced configuration options.',
      title: 'Configuration',
      titles: [],
    }

    // Add low priority first, high priority second
    const index = SearchIndex.fromSearchDocuments([lowPriorityDoc, highPriorityDoc])
    const { search: searchOptions } = config

    const results = index.search('configuration', searchOptions)

    // High priority doc should come first despite being added second
    expect(results[0]?.id).toBe('/docs/advanced.mdx#configuration')
    expect(results[1]?.id).toBe('/docs/config.mdx#configuration')
    // Score should be 10x higher for the high priority doc
    expect(results[0]?.score).toBeGreaterThan(results[1]?.score ?? 0)
  })

  it('boosts shallow paths over deep paths', () => {
    const shallowDoc: SearchDocuments.Document = {
      category: '',
      href: '/getting-started',
      id: '/docs/getting-started.mdx#getting-started',
      isPage: true,
      searchPriority: undefined,
      subtitle: '',
      text: ' Quick start guide.',
      title: 'Getting Started',
      titles: [],
    }

    const deepDoc: SearchDocuments.Document = {
      category: '',
      href: '/tempo/guides/getting-started',
      id: '/docs/tempo/guides/getting-started.mdx#getting-started',
      isPage: true,
      searchPriority: undefined,
      subtitle: '',
      text: ' Tempo quick start guide.',
      title: 'Getting Started',
      titles: [],
    }

    const index = SearchIndex.fromSearchDocuments([deepDoc, shallowDoc])
    const { search: searchOptions } = config

    const results = index.search('getting started', searchOptions)

    expect(results[0]?.id).toBe('/docs/getting-started.mdx#getting-started')
    expect(results[1]?.id).toBe('/docs/tempo/guides/getting-started.mdx#getting-started')
    expect(results[0]?.score).toBeGreaterThan(results[1]?.score ?? 0)
  })

  it('combines searchPriority and path depth boosts', () => {
    const shallowLowPriority: SearchDocuments.Document = {
      category: '',
      href: '/config',
      id: '/docs/config.mdx#config',
      isPage: true,
      searchPriority: 1,
      subtitle: '',
      text: ' Configuration guide.',
      title: 'Config',
      titles: [],
    }

    const deepHighPriority: SearchDocuments.Document = {
      category: '',
      href: '/api/v2/config',
      id: '/docs/api/v2/config.mdx#config',
      isPage: true,
      searchPriority: 5,
      subtitle: '',
      text: ' API v2 configuration.',
      title: 'Config',
      titles: [],
    }

    const index = SearchIndex.fromSearchDocuments([shallowLowPriority, deepHighPriority])
    const { search: searchOptions } = config

    const results = index.search('config', searchOptions)

    // Both have same title match, but different boosts
    // shallow (depth=1): priority=1, depthBoost=1/1=1, total=1
    // deep (depth=3): priority=5, depthBoost=1/3≈0.33, total≈1.67
    // Deep high-priority should still win due to higher priority
    expect(results[0]?.id).toBe('/docs/api/v2/config.mdx#config')
  })

  it('boosts title matches over text matches', () => {
    const docs = [
      ...buildDoc(
        '/docs/auth.mdx',
        '/auth',
        `# Authentication

This page covers authentication.
`,
      ),
      ...buildDoc(
        '/docs/other.mdx',
        '/other',
        `# Other Topic

Authentication is mentioned here too.
`,
      ),
    ]

    const index = SearchIndex.fromSearchDocuments(docs)
    const { search: searchOptions } = config

    // Title match should come first
    expect(index.search('authentication', searchOptions)).toMatchInlineSnapshot(`
      [
        {
          "category": "",
          "href": "/auth#authentication",
          "id": "/docs/auth.mdx#authentication",
          "isPage": true,
          "match": {
            "authentication": [
              "text",
              "title",
            ],
          },
          "queryTerms": [
            "authentication",
          ],
          "score": 5.1263386837208,
          "subtitle": "",
          "terms": [
            "authentication",
          ],
          "text": " This page covers authentication.",
          "title": "Authentication",
          "titles": [],
        },
        {
          "category": "",
          "href": "/other#other-topic",
          "id": "/docs/other.mdx#other-topic",
          "isPage": true,
          "match": {
            "authentication": [
              "text",
            ],
          },
          "queryTerms": [
            "authentication",
          ],
          "score": 0.5321245436660768,
          "subtitle": "",
          "terms": [
            "authentication",
          ],
          "text": " Authentication is mentioned here too.",
          "title": "Other Topic",
          "titles": [],
        },
      ]
    `)
  })

  it('creates searchable index from documents', () => {
    const docs = buildDoc(
      '/docs/api.mdx',
      '/api',
      `# API Reference

Documentation for the API.

## Authentication

Use JWT tokens for authentication.

## Endpoints

### GET /users

Returns a list of users.

### POST /users

Creates a new user.
`,
    )

    const index = SearchIndex.fromSearchDocuments(docs)
    const { search: searchOptions } = config

    expect(index.search('authentication', searchOptions)).toMatchInlineSnapshot(`
      [
        {
          "category": "",
          "href": "/api#authentication",
          "id": "/docs/api.mdx#authentication",
          "isPage": false,
          "match": {
            "authentication": [
              "text",
              "title",
            ],
          },
          "queryTerms": [
            "authentication",
          ],
          "score": 11.679997038529015,
          "subtitle": "",
          "terms": [
            "authentication",
          ],
          "text": " Use JWT tokens for authentication.",
          "title": "Authentication",
          "titles": [
            "API Reference",
          ],
        },
      ]
    `)

    expect(index.search('users', searchOptions)).toMatchInlineSnapshot(`
      [
        {
          "category": "",
          "href": "/api#get-users",
          "id": "/docs/api.mdx#get-users",
          "isPage": false,
          "match": {
            "users": [
              "text",
              "title",
            ],
          },
          "queryTerms": [
            "users",
          ],
          "score": 7.529393948443696,
          "subtitle": "",
          "terms": [
            "users",
          ],
          "text": " Returns a list of users.",
          "title": "GET /users",
          "titles": [
            "API Reference",
            "Endpoints",
          ],
        },
        {
          "category": "",
          "href": "/api#post-users",
          "id": "/docs/api.mdx#post-users",
          "isPage": false,
          "match": {
            "user": [
              "text",
            ],
            "users": [
              "title",
            ],
          },
          "queryTerms": [
            "users",
          ],
          "score": 5.35416915897831,
          "subtitle": "",
          "terms": [
            "users",
            "user",
          ],
          "text": " Creates a new user.",
          "title": "POST /users",
          "titles": [
            "API Reference",
            "Endpoints",
          ],
        },
      ]
    `)

    expect(index.search('JWT', searchOptions)).toMatchInlineSnapshot(`
      [
        {
          "category": "",
          "href": "/api#authentication",
          "id": "/docs/api.mdx#authentication",
          "isPage": false,
          "match": {
            "jwt": [
              "text",
            ],
          },
          "queryTerms": [
            "jwt",
          ],
          "score": 3.5139206265791856,
          "subtitle": "",
          "terms": [
            "jwt",
          ],
          "text": " Use JWT tokens for authentication.",
          "title": "Authentication",
          "titles": [
            "API Reference",
          ],
        },
      ]
    `)
  })

  it('matches camelCase parts', () => {
    const docs = buildDoc(
      '/docs/api.mdx',
      '/api',
      `# API

Use the \`createUser\` function to create users.
Use \`getUserById\` to fetch a user.
`,
    )

    const index = SearchIndex.fromSearchDocuments(docs)
    const { search: searchOptions } = config

    // "user" should match createUser and getUserById
    expect(index.search('user', searchOptions)).toMatchInlineSnapshot(`
      [
        {
          "category": "",
          "href": "/api#api",
          "id": "/docs/api.mdx#api",
          "isPage": true,
          "match": {
            "use": [
              "text",
            ],
            "user": [
              "text",
            ],
            "users": [
              "text",
            ],
          },
          "queryTerms": [
            "user",
          ],
          "score": 1.8612463059286608,
          "subtitle": "",
          "terms": [
            "user",
            "users",
            "use",
          ],
          "text": " Use the createUser function to create users.
      Use getUserById to fetch a user.",
          "title": "API",
          "titles": [],
        },
      ]
    `)

    // "create" should match createUser
    expect(index.search('create', searchOptions)).toMatchInlineSnapshot(`
      [
        {
          "category": "",
          "href": "/api#api",
          "id": "/docs/api.mdx#api",
          "isPage": true,
          "match": {
            "create": [
              "text",
            ],
            "createuser": [
              "text",
            ],
          },
          "queryTerms": [
            "create",
          ],
          "score": 1.3677741391122615,
          "subtitle": "",
          "terms": [
            "create",
            "createuser",
          ],
          "text": " Use the createUser function to create users.
      Use getUserById to fetch a user.",
          "title": "API",
          "titles": [],
        },
      ]
    `)
  })

  it('supports fuzzy matching', () => {
    const docs = buildDoc(
      '/docs/test.mdx',
      '/test',
      `# Configuration

Configure the application settings.
`,
    )

    const index = SearchIndex.fromSearchDocuments(docs)
    const { search: searchOptions } = config

    // Typo: "configration" should still match "Configuration"
    expect(index.search('configration', searchOptions)).toMatchInlineSnapshot(`
      [
        {
          "category": "",
          "href": "/test#configuration",
          "id": "/docs/test.mdx#configuration",
          "isPage": true,
          "match": {
            "configuration": [
              "title",
            ],
          },
          "queryTerms": [
            "configration",
          ],
          "score": 0.7212600530755363,
          "subtitle": "",
          "terms": [
            "configuration",
          ],
          "text": " Configure the application settings.",
          "title": "Configuration",
          "titles": [],
        },
      ]
    `)
  })

  it('supports prefix matching', () => {
    const docs = buildDoc(
      '/docs/test.mdx',
      '/test',
      `# Installation

Install the package.
`,
    )

    const index = SearchIndex.fromSearchDocuments(docs)
    const { search: searchOptions } = config

    // Prefix: "inst" should match "Installation" and "Install"
    expect(index.search('inst', searchOptions)).toMatchInlineSnapshot(`
      [
        {
          "category": "",
          "href": "/test#installation",
          "id": "/docs/test.mdx#installation",
          "isPage": true,
          "match": {
            "install": [
              "text",
            ],
            "installation": [
              "title",
            ],
          },
          "queryTerms": [
            "inst",
          ],
          "score": 0.8261755719936428,
          "subtitle": "",
          "terms": [
            "installation",
            "install",
          ],
          "text": " Install the package.",
          "title": "Installation",
          "titles": [],
        },
      ]
    `)
  })

  it('matches @-prefixed terms with prefix search', () => {
    const docs = buildDoc(
      '/docs/twoslash.mdx',
      '/twoslash',
      `# Twoslash

Use \`@noErrors\` to suppress errors.
Use \`@noErrorsCutted\` to cut output.
`,
    )

    const index = SearchIndex.fromSearchDocuments(docs)
    const { search: searchOptions } = config

    // "@noErr" should match "@noErrors" and "@noErrorsCutted"
    const results = index.search('@noErr', searchOptions)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]?.text).toContain('noErrors')
  })
})
