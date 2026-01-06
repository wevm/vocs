---
name: data-engineering
description: Expert data engineer for AI-powered search and chat on documentation sites. Use when implementing semantic search, RAG pipelines, vector embeddings, AI chat interfaces, or optimizing documentation for LLMs.
---

# Data Engineering

Expert guidance for building AI-powered search and chat experiences on documentation sites, including vector embeddings, RAG pipelines, and LLM integrations.

## Core Principles

1. **Context efficiency** – Minimize tokens while maximizing relevance
2. **Hybrid search** – Combine semantic and keyword search for best results
3. **Source grounding** – Always cite sources and provide verifiable answers
4. **Graceful degradation** – Fall back to simpler methods when AI isn't needed

## When to Use What

### Direct Context Injection

Use when:
- User is viewing a specific page (content already available)
- Context is small enough to fit in prompt (<8k tokens)
- Content is static and doesn't need semantic matching

```ts
// Page-specific chat: inject page content directly
const pageContent = await getPageContent(currentPath)
const response = await llm.chat({
  messages: [
    { role: 'system', content: `Answer based on this documentation:\n\n${pageContent}` },
    { role: 'user', content: userQuestion },
  ],
})
```

### RAG (Retrieval-Augmented Generation)

Use when:
- Global search across entire documentation
- Content exceeds context window limits
- Knowledge base is large or frequently updated
- Need semantic understanding of queries

```ts
// Global search: retrieve relevant chunks first
const relevantChunks = await vectorStore.search(userQuery, { topK: 5 })
const context = relevantChunks.map((c) => c.content).join('\n\n---\n\n')
const response = await llm.chat({
  messages: [
    { role: 'system', content: `Answer based on these docs:\n\n${context}` },
    { role: 'user', content: userQuery },
  ],
})
```

### Decision Matrix

| Scenario | Approach | Reason |
|----------|----------|--------|
| Page-specific question | Direct injection | Content already loaded, no retrieval needed |
| Cross-page question | RAG | Need to find relevant content across docs |
| Exact term lookup (IDs, SKUs) | Keyword search | Semantic search may miss exact matches |
| Conceptual question | Semantic search | Understanding intent matters more than keywords |
| Code examples | Hybrid search | Need exact syntax + conceptual relevance |

## Vector Embeddings

### Embedding Models

| Model | Dimensions | Use Case |
|-------|------------|----------|
| `text-embedding-3-small` | 1536 | Cost-effective, good for most docs |
| `text-embedding-3-large` | 3072 | Higher accuracy, larger docs |
| `text-embedding-ada-002` | 1536 | Legacy, still widely supported |

### Similarity Metrics

Prefer **cosine similarity** for text embeddings:

```ts
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}
```

### Vector Databases

| Database | Hosting | Best For |
|----------|---------|----------|
| Pinecone | Managed | Production, scale |
| Weaviate | Self-hosted/Cloud | Hybrid search |
| Qdrant | Self-hosted/Cloud | Performance |
| pgvector | PostgreSQL extension | Existing Postgres infra |
| ChromaDB | Embedded | Development, small scale |

## Chunking Strategies

### Chunk Size Guidelines

| Content Type | Chunk Size | Overlap |
|--------------|------------|---------|
| API reference | 500-800 tokens | 50 tokens |
| Conceptual guides | 800-1200 tokens | 100 tokens |
| Code examples | Keep together | No split |
| Tables | Keep together | No split |

### Semantic Chunking

Group content by semantic boundaries, not arbitrary token limits:

```ts
type Chunk = {
  content: string
  metadata: {
    path: string
    heading: string
    section: string
    type: 'concept' | 'api' | 'example' | 'reference'
  }
}

function chunkDocument(doc: Document): Chunk[] {
  const chunks: Chunk[] = []
  
  for (const section of doc.sections) {
    // Keep code blocks together
    if (section.type === 'code') {
      chunks.push({
        content: section.content,
        metadata: { ...doc.metadata, type: 'example' },
      })
      continue
    }
    
    // Split prose by paragraphs, respecting token limits
    const paragraphs = section.content.split('\n\n')
    let currentChunk = ''
    
    for (const para of paragraphs) {
      if (tokenCount(currentChunk + para) > 800) {
        chunks.push({ content: currentChunk, metadata: doc.metadata })
        currentChunk = para
      } else {
        currentChunk += '\n\n' + para
      }
    }
    
    if (currentChunk) {
      chunks.push({ content: currentChunk.trim(), metadata: doc.metadata })
    }
  }
  
  return chunks
}
```

### Agentic Chunking

Optimize chunks for AI retrieval by including context:

```ts
function enrichChunk(chunk: Chunk, doc: Document): Chunk {
  return {
    ...chunk,
    content: [
      `# ${doc.title}`,
      `> ${doc.description}`,
      '',
      `## ${chunk.metadata.heading}`,
      chunk.content,
    ].join('\n'),
  }
}
```

## Docs Search Architecture

The recommended approach is **keyword search first, with semantic AI hydration**:

1. **MiniSearch** handles primary keyword search (fast, client-side, no API costs)
2. **Semantic AI suggestions** enhance results when keyword search is insufficient

This avoids over-engineering: most documentation searches are keyword lookups. Reserve AI for when users need conceptual understanding.

### MiniSearch Configuration

MiniSearch is the primary search engine, built at compile time via a Vite plugin:

```ts
import MiniSearch from 'minisearch'

type SearchDocument = {
  id: string
  href: string
  title: string
  titles: string[]  // Parent headings for context
  text: string      // Searchable content
  html: string      // For rendering excerpts
  isPage: boolean   // Is this the page root or a section?
}

const index = new MiniSearch<SearchDocument>({
  fields: ['title', 'titles', 'text'],
  storeFields: ['href', 'html', 'isPage', 'text', 'title', 'titles'],
})
```

### Building the Index (Vite Plugin)

Build the search index at compile time and serve as a static JSON file:

```ts
import type { Plugin } from 'vite'
import MiniSearch from 'minisearch'

const virtualModuleId = 'virtual:vocs/search-index'
const resolvedVirtualModuleId = '\0' + virtualModuleId

export function searchPlugin(): Plugin {
  let index: MiniSearch<SearchDocument>
  let indexHash: string

  return {
    name: 'vocs:search',

    config() {
      return {
        optimizeDeps: {
          include: ['minisearch'],
        },
      }
    },

    async buildStart() {
      index = await buildSearchIndex()
    },

    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
    },

    load(id) {
      if (id !== resolvedVirtualModuleId) return

      // Dev: inline the index
      if (process.env.NODE_ENV === 'development') {
        return `export const getSearchIndex = async () => ${JSON.stringify(JSON.stringify(index))}`
      }

      // Prod: fetch from static file
      return `export const getSearchIndex = async () => JSON.stringify(await ((await fetch("/.vocs/search-index-${indexHash}.json")).json()))`
    },

    writeBundle() {
      // Save index to static file
      const json = index.toJSON()
      indexHash = hash(JSON.stringify(json), 8)
      fs.writeJSONSync(`dist/.vocs/search-index-${indexHash}.json`, json)
    },

    handleHotUpdate({ file, server }) {
      if (!file.endsWith('.md') && !file.endsWith('.mdx')) return

      // Re-index changed file
      updateIndexForFile(index, file)

      // Trigger HMR
      const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
      if (mod) {
        server.moduleGraph.invalidateModule(mod)
        server.ws.send({
          type: 'update',
          updates: [{ acceptedPath: mod.url, path: mod.url, timestamp: Date.now(), type: 'js-update' }],
        })
      }
    },
  }
}
```

### Indexing Documents

Split pages into sections for granular search results:

```ts
async function buildSearchIndex(): Promise<MiniSearch<SearchDocument>> {
  const pages = await glob('pages/**/*.{md,mdx}')

  const documents = await Promise.all(
    pages.map(async (pagePath) => {
      const mdx = await fs.readFile(pagePath, 'utf-8')
      const { html, frontmatter } = await compileMdx(mdx)

      if (frontmatter.searchable === false) return []

      const sections = splitPageIntoSections(html)
      const href = pagePath
        .replace(/^pages/, '')
        .replace(/\.(md|mdx)$/, '')
        .replace(/\/index$/, '')

      return sections.map((section) => ({
        id: `${pagePath}#${section.anchor}`,
        href: `${href}#${section.anchor}`,
        title: section.titles.at(-1)!,
        titles: section.titles.slice(0, -1),
        text: section.text,
        html: section.html,
        isPage: section.isPage,
      }))
    }),
  )

  const index = new MiniSearch<SearchDocument>({
    fields: ['title', 'titles', 'text'],
    storeFields: ['href', 'html', 'isPage', 'text', 'title', 'titles'],
  })

  await index.addAllAsync(documents.flat())
  return index
}

function splitPageIntoSections(html: string): Section[] {
  // Split by headings, preserving hierarchy
  const headingRegex = /<h(\d*).*?>(.*?<a.*? href=".*?".*?>.*?<\/a>)<\/h\1>/gi
  // ... extract sections with anchor, text, titles, html
}
```

### Client-Side Search Hook

Load and query the index on the client:

```ts
import { getSearchIndex } from 'virtual:vocs/search-index'
import MiniSearch from 'minisearch'

export function useSearchIndex(): MiniSearch<SearchDocument> | undefined {
  const [searchIndex, setSearchIndex] = React.useState<MiniSearch<SearchDocument>>()

  React.useEffect(() => {
    ;(async () => {
      const json = await getSearchIndex()
      const index = MiniSearch.loadJSON<SearchDocument>(json, {
        fields: ['title', 'titles', 'text'],
        storeFields: ['href', 'html', 'isPage', 'text', 'title', 'titles'],
        searchOptions: {
          boost: { title: 4, text: 2, titles: 1 },
          fuzzy: 0.2,
          prefix: true,
        },
      })
      setSearchIndex(index)
    })()
  }, [])

  return searchIndex
}
```

### MiniSearch Query Options

Configure search behavior for documentation:

```ts
const results = index.search(query, {
  boost: { title: 4, text: 2, titles: 1 },  // Prioritize title matches
  fuzzy: 0.2,                                // Allow typos
  prefix: true,                              // Match word prefixes
  combineWith: 'AND',                        // Require all terms (stricter)
})
```

| Option | Value | Effect |
|--------|-------|--------|
| `boost.title` | 4 | Title matches score 4x higher |
| `boost.text` | 2 | Body text matches score 2x |
| `fuzzy` | 0.2 | Allow ~20% character difference |
| `prefix` | true | "react" matches "reactive" |
| `combineWith` | 'AND' | All terms must match |

### AI Suggestion Hydration

When keyword results are insufficient, hydrate with semantic suggestions:

```ts
type SearchResult = {
  href: string
  title: string
  excerpt: string
  score: number
  source: 'keyword' | 'ai'
}

async function search(
  query: string,
  options: { minKeywordResults?: number } = {},
): Promise<SearchResult[]> {
  const { minKeywordResults = 3 } = options

  // Primary: keyword search with MiniSearch
  const keywordResults = index.search(query, {
    boost: { title: 4, text: 2, titles: 1 },
    fuzzy: 0.2,
    prefix: true,
  })

  const results: SearchResult[] = keywordResults.map((r) => ({
    href: r.href,
    title: r.title,
    excerpt: r.html.slice(0, 200),
    score: r.score,
    source: 'keyword',
  }))

  // Only call AI if keyword search is insufficient
  if (results.length < minKeywordResults) {
    const aiSuggestions = await getAiSuggestions(query, results)
    results.push(...aiSuggestions)
  }

  return results
}

async function getAiSuggestions(
  query: string,
  existingResults: SearchResult[],
): Promise<SearchResult[]> {
  // Use embeddings to find semantically similar content
  const queryEmbedding = await getEmbedding(query)
  const similar = await vectorStore.search(queryEmbedding, { topK: 5 })

  // Filter out results already found by keyword search
  const existingHrefs = new Set(existingResults.map((r) => r.href))
  const newResults = similar.filter((r) => !existingHrefs.has(r.href))

  return newResults.map((r) => ({
    href: r.href,
    title: r.metadata.title,
    excerpt: r.content.slice(0, 200),
    score: r.score,
    source: 'ai',
  }))
}
```

### When to Trigger AI Suggestions

| Scenario | Action |
|----------|--------|
| Keyword results >= 3 | Show keyword results only |
| Keyword results < 3 | Hydrate with AI suggestions |
| No keyword results | Full semantic search |
| Exact term (ID, SKU) | Keyword only, no AI |
| Question format ("how do I...") | Prefer AI suggestions |

## Hybrid Search (Alternative)

For sites that always want combined results, use Reciprocal Rank Fusion:

```ts
function reciprocalRankFusion(
  keywordResults: SearchResult[],
  semanticResults: SearchResult[],
  keywordWeight = 0.6,
): SearchResult[] {
  const k = 60 // RRF constant
  const scores = new Map<string, { result: SearchResult; score: number }>()

  keywordResults.forEach((r, i) => {
    const rrf = keywordWeight / (k + i + 1)
    const existing = scores.get(r.href)
    scores.set(r.href, {
      result: r,
      score: (existing?.score || 0) + rrf,
    })
  })

  semanticResults.forEach((r, i) => {
    const rrf = (1 - keywordWeight) / (k + i + 1)
    const existing = scores.get(r.href)
    scores.set(r.href, {
      result: existing?.result || r,
      score: (existing?.score || 0) + rrf,
    })
  })

  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .map(({ result, score }) => ({ ...result, score }))
}
```

## LLM-Friendly Documentation

### Content Structure

Structure documentation for optimal AI comprehension:

```md
# API Reference: createUser

> Creates a new user account with the specified parameters.

## Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| email | string | Yes | User's email address |
| name | string | Yes | Display name |
| role | 'admin' \| 'user' | No | User role (default: 'user') |

## Returns

`Promise<User>` - The created user object.

## Example

\`\`\`ts
const user = await createUser({
  email: 'alice@example.com',
  name: 'Alice',
})
\`\`\`

## Related

- [updateUser](/api/update-user) - Update an existing user
- [deleteUser](/api/delete-user) - Delete a user
```

### llms.txt Standard

Generate an `llms.txt` file for AI crawlers:

```ts
function generateLlmsTxt(pages: Page[]): string {
  const lines = [
    '# Documentation',
    '',
    '> This documentation covers the Vocs framework.',
    '',
    '## Pages',
    '',
  ]
  
  for (const page of pages) {
    lines.push(`- [${page.title}](${page.url}): ${page.description}`)
  }
  
  return lines.join('\n')
}
```

Example output:

```txt
# Documentation

> This documentation covers the Vocs framework.

## Pages

- [Getting Started](/guide/getting-started): Quick start guide for new users
- [Configuration](/guide/configuration): Configure your Vocs project
- [API Reference](/api): Complete API documentation
```

### Semantic HTML

Use semantic elements for better AI parsing:

```tsx
// ✅ Good - semantic structure
<article>
  <header>
    <h1>createUser</h1>
    <p>Creates a new user account.</p>
  </header>
  <section aria-labelledby="parameters">
    <h2 id="parameters">Parameters</h2>
    <dl>
      <dt>email</dt>
      <dd>User's email address</dd>
    </dl>
  </section>
</article>

// ❌ Bad - div soup
<div class="page">
  <div class="title">createUser</div>
  <div class="content">
    <div class="section">Parameters</div>
  </div>
</div>
```

## AI Chat Implementation

### Chat Interface Pattern

```ts
type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
}

type Source = {
  title: string
  path: string
  excerpt: string
}

async function chat(
  messages: ChatMessage[],
  context: { currentPath?: string },
): Promise<ChatMessage> {
  const lastMessage = messages[messages.length - 1]
  
  // Determine context strategy
  let systemContext: string
  let sources: Source[] = []
  
  if (context.currentPath) {
    // Page-specific: inject page content directly
    const pageContent = await getPageContent(context.currentPath)
    systemContext = `You are a documentation assistant. Answer based on this page:\n\n${pageContent}`
  } else {
    // Global: use RAG
    const results = await hybridSearch(lastMessage.content, { topK: 5 })
    sources = results.map((r) => ({
      title: r.metadata.title,
      path: r.metadata.path,
      excerpt: r.content.slice(0, 200),
    }))
    systemContext = `You are a documentation assistant. Answer based on these excerpts:\n\n${results.map((r) => r.content).join('\n\n---\n\n')}`
  }
  
  const response = await llm.chat({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemContext },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  })
  
  return {
    role: 'assistant',
    content: response.content,
    sources,
  }
}
```

### Source Citations

Always include citations in responses:

```ts
function formatResponseWithCitations(
  content: string,
  sources: Source[],
): string {
  let formatted = content
  
  // Add source references
  if (sources.length > 0) {
    formatted += '\n\n---\n\n**Sources:**\n'
    sources.forEach((source, i) => {
      formatted += `\n${i + 1}. [${source.title}](${source.path})`
    })
  }
  
  return formatted
}
```

## Context Window Optimization

### Token Budget Allocation

| Component | Allocation | Tokens (16k context) |
|-----------|------------|---------------------|
| System prompt | 5% | 800 |
| Retrieved context | 60% | 9,600 |
| Conversation history | 25% | 4,000 |
| Response buffer | 10% | 1,600 |

### Context Compression

Compress context when approaching limits:

```ts
async function compressContext(
  chunks: string[],
  maxTokens: number,
): Promise<string> {
  const totalTokens = chunks.reduce((sum, c) => sum + tokenCount(c), 0)
  
  if (totalTokens <= maxTokens) {
    return chunks.join('\n\n---\n\n')
  }
  
  // Summarize each chunk to fit budget
  const targetPerChunk = Math.floor(maxTokens / chunks.length)
  const compressed = await Promise.all(
    chunks.map((chunk) =>
      llm.chat({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Summarize this in ${targetPerChunk} tokens, preserving key facts:`,
          },
          { role: 'user', content: chunk },
        ],
      }),
    ),
  )
  
  return compressed.map((r) => r.content).join('\n\n---\n\n')
}
```

## Indexing Pipeline

### Build-Time Indexing

Generate embeddings at build time for static docs:

```ts
// scripts/index-docs.ts
import * as VectorStore from './vector-store.js'

async function indexDocs(): Promise<void> {
  const pages = await glob('pages/**/*.mdx')
  
  for (const pagePath of pages) {
    const content = await fs.readFile(pagePath, 'utf-8')
    const chunks = chunkDocument(parseMarkdown(content))
    
    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk.content)
      await VectorStore.upsert({
        id: `${pagePath}#${chunk.metadata.heading}`,
        embedding,
        metadata: {
          path: pagePath,
          ...chunk.metadata,
        },
        content: chunk.content,
      })
    }
  }
}
```

### Incremental Updates

Only re-index changed pages:

```ts
async function incrementalIndex(changedFiles: string[]): Promise<void> {
  for (const file of changedFiles) {
    // Delete old chunks for this file
    await VectorStore.deleteByPath(file)
    
    // Re-index
    const content = await fs.readFile(file, 'utf-8')
    const chunks = chunkDocument(parseMarkdown(content))
    
    for (const chunk of chunks) {
      await VectorStore.upsert({
        id: `${file}#${chunk.metadata.heading}`,
        embedding: await getEmbedding(chunk.content),
        metadata: { path: file, ...chunk.metadata },
        content: chunk.content,
      })
    }
  }
}
```

## Performance Checklist

- [ ] Cache embeddings at build time, not runtime
- [ ] Use smaller embedding models for development
- [ ] Batch embedding requests (max 2048 texts per call for OpenAI)
- [ ] Implement result caching for repeated queries
- [ ] Use streaming responses for chat interfaces
- [ ] Pre-warm vector store connections
- [ ] Set appropriate topK limits (5-10 usually sufficient)
- [ ] Monitor token usage and costs

## Security Checklist

- [ ] Never expose API keys in client-side code
- [ ] Sanitize user inputs before embedding/searching
- [ ] Rate limit API endpoints
- [ ] Log and monitor for abuse patterns
- [ ] Use server-side endpoints for all AI operations
- [ ] Validate and sanitize LLM responses before displaying
- [ ] Implement content filtering for user-generated queries

## Documentation

### Embeddings & Vector Search

- OpenAI Embeddings: https://platform.openai.com/docs/guides/embeddings
- Pinecone: https://docs.pinecone.io/
- Weaviate: https://weaviate.io/developers/weaviate
- pgvector: https://github.com/pgvector/pgvector

### RAG & Context

- RAG Best Practices: https://platform.openai.com/docs/guides/prompt-engineering
- llms.txt Standard: https://llmstxt.org/
- Context Engineering: https://www.anthropic.com/news/claude-context-protocol

### Implementation References

- Mintlify AI: https://mintlify.com/docs/ai
- GitBook AI: https://docs.gitbook.com/product-tour/git-book-ai
- Algolia DocSearch: https://docsearch.algolia.com/
