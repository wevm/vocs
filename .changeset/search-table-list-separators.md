---
"vocs": patch
---

Separate table cells, list items and nested blocks with a space when extracting page text for the search index. Previously they were concatenated with no separator, so a whole table became one token and values inside it (for example contract addresses) could not be found.
