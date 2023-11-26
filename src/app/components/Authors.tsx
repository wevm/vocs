import { Fragment } from 'react'
import { usePageData } from '../hooks/usePageData.js'
import * as styles from './Authors.css.js'

export type AuthorsProps = {
  authors?: string | string[]
  date?: string
}

export function Authors(props: AuthorsProps) {
  const { frontmatter } = usePageData()

  const { authors: authors_ = frontmatter?.authors, date = frontmatter?.date } = props

  const authors = (() => {
    if (!authors_) return undefined
    if (Array.isArray(authors_)) return authors_
    return authors_.split(',').map((author) => author.trim())
  })()

  return (
    <div className={styles.root}>
      {date}
      {authors && date ? ' by ' : 'By '}
      <span className={styles.authors}>
        {authors?.map((author, index) => {
          const { text, url } = parseAuthor(author)
          return (
            <Fragment key={index}>
              {url ? (
                <a className={styles.link} href={url} target="_blank" rel="noopener noreferrer">
                  {text}
                </a>
              ) : (
                text
              )}
              {index < authors.length - 2 && <span className={styles.separator}>, </span>}
              {index < authors.length - 1 && <span className={styles.separator}> & </span>}
            </Fragment>
          )
        })}
      </span>
    </div>
  )
}

function parseAuthor(author: string) {
  const match = author.match(/\[(.+)\]\((.+)\)/)
  if (!match) return { text: author, url: undefined }
  return {
    text: match[1],
    url: match[2],
  }
}
