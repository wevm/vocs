import * as fs from 'node:fs'

/** File modification times, keyed by path. `undefined` records a missing file. */
export type FileVersions = Map<string, number | undefined>

/** Returns the file's modification time, or `undefined` when it does not exist. */
export function version(file: string): number | undefined {
  try {
    return fs.statSync(file).mtimeMs
  } catch {
    return undefined
  }
}

/** Whether any recorded file changed, appeared, or disappeared since it was recorded. */
export function changed(versions: FileVersions): boolean {
  for (const [file, recorded] of versions) if (version(file) !== recorded) return true
  return false
}
