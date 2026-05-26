import { Link } from 'waku'
import LucideFileQuestion from '~icons/lucide/file-question'
import LucideHome from '~icons/lucide/home'

export function NotFound() {
  return (
    <div
      className="vocs:flex vocs:flex-col vocs:items-center vocs:justify-center vocs:min-h-[60vh] vocs:px-6 vocs:py-16 vocs:text-center"
      data-v-not-found
    >
      <div
        className="vocs:flex vocs:items-center vocs:justify-center vocs:size-20 vocs:rounded-full vocs:bg-surface vocs:border vocs:border-primary vocs:text-secondary vocs:mb-6"
        data-v-not-found-icon
      >
        <LucideFileQuestion className="vocs:size-10" />
      </div>

      <h1
        className="vocs:text-heading vocs:text-h1 vocs:font-medium vocs:tracking-[-0.04em] vocs:leading-h1 vocs:mb-3"
        data-v-not-found-title
      >
        Page not found
      </h1>

      <p
        className="vocs:text-secondary vocs:leading-p vocs:tracking-normal vocs:max-w-md vocs:mb-8"
        data-v-not-found-description
      >
        The page you're looking for doesn't exist or has been moved.
      </p>

      <Link
        className="vocs:inline-flex vocs:items-center vocs:gap-2 vocs:px-5 vocs:py-2.5 vocs:rounded-lg vocs:bg-surface vocs:border vocs:border-primary vocs:text-heading vocs:font-medium vocs:transition-colors vocs:duration-150 vocs:hover:bg-surfaceMuted"
        data-v-not-found-link
        to="/"
      >
        <LucideHome className="vocs:size-4 vocs:text-secondary" />
        Back to home
      </Link>
    </div>
  )
}

export declare namespace NotFound {
  export type Props = Record<string, never>
}
