import type { MDXComponents } from 'mdx/types.js'

import { Anchor } from './Anchor.js'
import { Aside } from './Aside.js'
import { Blockquote } from './Blockquote.js'
import { Code } from './Code.js'
import { Div } from './Div.js'
import { H1 } from './H1.js'
import { H2 } from './H2.js'
import { H3 } from './H3.js'
import { H4 } from './H4.js'
import { H5 } from './H5.js'
import { H6 } from './H6.js'
import { Header } from './Header.js'
import { HorizontalRule } from './HorizontalRule.js'
import { List } from './List.js'
import { ListItem } from './ListItem.js'
import { Paragraph } from './Paragraph.js'
import { Pre } from './Pre.js'
import { Section } from './Section.js'
import { Strong } from './Strong.js'
import { Table } from './Table.js'
import { TableCell } from './TableCell.js'
import { TableHeader } from './TableHeader.js'
import { TableRow } from './TableRow.js'

export const components: MDXComponents = {
  a: Anchor,
  aside: Aside,
  blockquote: Blockquote,
  code: Code,
  div: Div,
  pre: Pre,
  header: Header,
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  hr: HorizontalRule,
  li: ListItem,
  ol: (props) => <List ordered {...props} />,
  p: Paragraph,
  section: Section,
  strong: Strong,
  table: Table,
  td: TableCell,
  th: TableHeader,
  tr: TableRow,
  ul: (props) => <List ordered={false} {...props} />,
}
