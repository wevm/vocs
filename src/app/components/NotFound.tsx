import { spaceVars } from '../styles/vars.css.js'
import { Link } from './Link.js'
import * as styles from './NotFound.css.js'
import { H1 } from './mdx/H1.js'
import { Paragraph } from './mdx/Paragraph.js'

export function NotFound() {
  return (
    <div className={styles.root}>
      <H1>Page Not Found</H1>
      <div style={{ height: spaceVars['24'] }} />
      <hr className={styles.divider} />
      <div style={{ height: spaceVars['24'] }} />
      <Paragraph>The page you were looking for could not be found.</Paragraph>
      <div style={{ height: spaceVars['8'] }} />
      <Link href="/">Go to Home Page</Link>
    </div>
  )
}
