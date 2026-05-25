import { execSync } from 'node:child_process'

export function getLastModified(filePath: string): string | undefined {
  try {
    const result = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
    return result || undefined
  } catch {
    return undefined
  }
}
