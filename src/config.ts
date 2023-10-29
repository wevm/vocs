export type Config = {
  sidebar: Sidebar
}

export function defineConfig(config: Config) {
  return config
}

//////////////////////////////////////////////////////

export type SidebarItem = {
  title: string
  path?: string
  children?: SidebarItem[]
}

export type Sidebar = SidebarItem[]
