import { padStartSlash } from './slash.js'

export function getFsPath(path: string) {
  return `/@fs${padStartSlash(path, false)}`
}
