export type Config = {
  /** Navigation displayed on the sidebar. */
  sidebar?: Sidebar
  /** Social links displayed in the top navigation. */
  socials?: Socials
  /** Title for your documentation. */
  title?: string
}

export function defineConfig(config: Config) {
  return config
}

//////////////////////////////////////////////////////

export type SidebarItem = {
  /** Title to display on the sidebar. */
  title: string
  /** Optional pathname to the target documentation page. */
  path?: string
  /** Optional children to nest under this item. */
  children?: SidebarItem[]
}

export type Sidebar = SidebarItem[]

export type SocialItem = {
  /** Social icon to display. */
  icon: // TODO: Support custom SVG icons
  'discord' | 'github' | 'x'
  /** Link to the social. */
  link: string
}

export type Socials = SocialItem[]
