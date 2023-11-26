import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { posts } from 'virtual:blog'

import { Authors } from './Authors.js'
import * as styles from './BlogPosts.css.js'

export function BlogPosts() {
  return (
    <div className={styles.root}>
      {posts.map((post, index) => (
        <Fragment key={index}>
          <div className={styles.post}>
            <Link to={post.path}>
              <h2 className={styles.title}>{post.title}</h2>
              <Authors authors={post.authors} date={post.date} />
              <p className={styles.description}>
                {post.description} <span className={styles.readMore}>[→]</span>
              </p>
            </Link>
          </div>
          {index < posts.length - 1 && <hr className={styles.divider} />}
        </Fragment>
      ))}
    </div>
  )
}
