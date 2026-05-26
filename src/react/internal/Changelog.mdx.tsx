import { Suspense } from 'react'
import * as Actions from '../../server/changelog.js'
import { Changelog as Changelog_client, Skeleton } from './Changelog.client.js'

export function Changelog(props: Changelog.Props): React.JSX.Element {
  return (
    <Suspense fallback={<Skeleton />}>
      <ChangelogAsync {...props} />
    </Suspense>
  )
}

async function ChangelogAsync(props: Changelog.Props): Promise<React.JSX.Element> {
  const limit = props['data-v-changelog-limit']
    ? Number.parseInt(props['data-v-changelog-limit'], 10)
    : 999

  const releases = await Actions.fetchChangelog({ limit })
  return <Changelog_client releases={releases} />
}

export declare namespace Changelog {
  export type Props = {
    'data-v-changelog-limit'?: string | undefined
  }
}
