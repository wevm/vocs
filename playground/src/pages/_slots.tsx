export function Footer() {
  return (
    <div className="vocs:text-center vocs:text-secondary vocs:text-sm vocs:pt-6">
      © 2025 My Project. All rights reserved.
    </div>
  )
}

export function OutlineFooter() {
  return (
    <div className="vocs:text-xs vocs:text-secondary">
      Need help?{' '}
      <a className="vocs:text-accent vocs:hover:underline" href="https://discord.gg/example">
        Join our Discord
      </a>
    </div>
  )
}
