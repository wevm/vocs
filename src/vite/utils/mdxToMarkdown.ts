import { readFileSync } from 'node:fs'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkStringify from 'remark-stringify'

export const convertMdxToMarkdown = async (filePath: string): Promise<string> => {
  const content = readFileSync(filePath, 'utf-8')

  // Process MDX: parse, then stringify back to markdown
  // This preserves JSX components, directives, and frontmatter
  const result = await unified()
    .use(remarkParse) // Parse markdown
    .use(remarkMdx) // Parse MDX (JSX components)
    .use(remarkFrontmatter, ['yaml', 'toml']) // Parse frontmatter
    .use(remarkGfm) // Parse GFM (tables, strikethrough, etc.)
    .use(remarkDirective) // Parse directives (::)
    .use(remarkStringify, {
      // Stringify back to markdown
      bullet: '-',
      fence: '`',
      fences: true,
      incrementListMarker: true,
    })
    .process(content)

  return String(result)
}

