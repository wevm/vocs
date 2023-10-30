export type Config = {
  /** Documentation sidebar navigation. */
  sidebar?: Sidebar
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
