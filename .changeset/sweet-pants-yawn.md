---
"vocs": minor
---

**Breaking:** Migrated to `rehype-shiki` from `rehype-pretty-code`.

The following **meta properties** on code blocks have been removed:

- Highlight Lines (\`\`\`js {1-3,4}).
  - Use the inline `// [!code hl]` notation instead.
- Highlight Chars (\`\`\`js /carrot/, \`\`\`js "carrot", etc). 
  - Use the inline `// [!code word]` notation instead.