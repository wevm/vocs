import { platform } from 'node:os'
import { padStartSlash } from './slash.js'

export const isWin32 = platform() === 'win32'

export function getFsPath(path: string) {
  return `/@fs${padStartSlash(path, false)}`
}
