import { Fragment } from 'react'
import { posts } from 'virtual:blog'

import { Authors } from './Authors.js'
import * as styles from './BlogPosts.css.js'
import { RouterLink } from './RouterLink.js'

export function BlogPosts() {
  return (
    <div className={styles.root}>
      {posts.map((post, index) => (
        <Fragment key={index}>
          <div className={styles.post}>
            <RouterLink to={post.path}>
              <h2 className={styles.title}>{post.title}</h2>
              <Authors authors={post.authors} date={post.date} />
              <p className={styles.description}>
                {post.description} <span className={styles.readMore}>[→]</span>
              </p>
            </RouterLink>
          </div>
          {index < posts.length - 1 && <hr className={styles.divider} />}
        </Fragment>
      ))}
    </div>
  )
}
