import { platform } from 'node:os'
import { padStartSlash } from './slash.js'

export const isWin32 = platform() === 'win32'

export function getFsPath(path: string) {
  return `/@fs${padStartSlash(path, false)}`
}

// Only file and data URLs are supported by the default ESM loader. 
// On Windows, absolute paths must be valid `file://` URLs.
export function compatibleAbsolutePath(path: string) {
  return isWin32 ? `file://${path}` : path
}