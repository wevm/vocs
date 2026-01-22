import * as fs from 'node:fs'
import * as path from 'node:path'
import type * as HAst from 'hast'
import { imageSize } from 'image-size'
import * as UnistUtil from 'unist-util-visit'
import type { VFile } from 'vfile'
import type * as Config from './config.js'

/**
 * Rehype plugin that adds width and height attributes to local images.
 * This prevents Cumulative Layout Shift (CLS) by reserving space for images
 * before they load.
 *
 * The plugin resolves image sources relative to the public directory or
 * the current file's directory, and uses the `image-size` library to
 * determine dimensions.
 */
export function rehypeImageSize(config: Config.Config) {
  const { rootDir, srcDir, pagesDir } = config
  const pagesDirPath = path.join(rootDir, srcDir, pagesDir)
  const publicDirPath = path.join(rootDir, 'public')

  return () => (tree: HAst.Root, vfile: VFile) => {
    UnistUtil.visit(tree, 'element', (node) => {
      const element = node as HAst.Element
      if (element.tagName !== 'img') return

      const src = element.properties?.['src']
      if (typeof src !== 'string') return

      // Skip if width/height already set
      if (element.properties?.['width'] || element.properties?.['height']) return

      // Skip external images and data URIs
      if (src.match(/^(https?:\/\/|data:)/)) return

      // Resolve the image path
      const imagePath = resolveImagePath(src, vfile.dirname ?? pagesDirPath, publicDirPath)
      if (!imagePath) return

      try {
        const buffer = fs.readFileSync(imagePath)
        const dimensions = imageSize(new Uint8Array(buffer))
        if (dimensions.width && dimensions.height) {
          element.properties['width'] = dimensions.width
          element.properties['height'] = dimensions.height
        }
      } catch {
        // Silently ignore files that can't be read (missing, unsupported format, etc.)
      }
    })
  }
}

function resolveImagePath(src: string, currentDir: string, publicDir: string): string | undefined {
  // Absolute paths (starting with /) resolve from public directory
  if (src.startsWith('/')) {
    const publicPath = path.join(publicDir, src)
    if (fs.existsSync(publicPath)) return publicPath
    return undefined
  }

  // Relative paths resolve from current file's directory
  const relativePath = path.resolve(currentDir, src)
  if (fs.existsSync(relativePath)) return relativePath

  // Also try public directory as fallback for unresolved relative paths
  const publicFallback = path.join(publicDir, src)
  if (fs.existsSync(publicFallback)) return publicFallback

  return undefined
}

export declare namespace rehypeImageSize {
  type Options = Config.Config
}
