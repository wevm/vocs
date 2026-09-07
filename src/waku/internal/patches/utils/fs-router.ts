const IGNORED_PATH_PARTS = new Set(['_actions', '_components', '_hooks'])

/** Ignore colocated actions, components, and hooks in the pages directory. */
export const isIgnoredPath = (paths: string[]) => paths.some((p) => IGNORED_PATH_PARTS.has(p))
