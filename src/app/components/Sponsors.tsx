import { assignInlineVars } from '@vanilla-extract/dynamic'
import clsx from 'clsx'
import { Fragment } from 'react'
import { useConfig } from '../hooks/useConfig.js'
import { Link } from './Link.js'
import * as styles from './Sponsors.css.js'

export function Sponsors() {
  const { sponsors } = useConfig()
  return (
    <div className={styles.root}>
      {sponsors?.map((sponsorSet, i) => (
        <Fragment key={i}>
          <div className={styles.title}>{sponsorSet.name}</div>
          {sponsorSet.items.map((sponsorRow, i) => (
            <div
              className={styles.row}
              style={assignInlineVars({
                [styles.columnsVar]: sponsorRow.length.toString(),
                [styles.heightVar]: `${sponsorSet.height?.toString() ?? '40'}px`,
              })}
              key={i}
            >
              {sponsorRow.map((sponsor, i) => (
                <Link
                  className={clsx(styles.column, sponsor ? styles.sponsor : undefined)}
                  hideExternalIcon
                  href={sponsor?.link}
                  key={i}
                  variant="styleless"
                >
                  <img className={styles.image} src={sponsor?.image} alt={sponsor?.name} />
                </Link>
              ))}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  )
}
