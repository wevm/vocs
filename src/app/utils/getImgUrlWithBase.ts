import type { IconUrl, Sidebar, SidebarItem, TopNav } from '../../config.js'
import type { UseSidebarReturnType } from '../hooks/useSidebar.js';


export function getImgUrlWithBase(url: IconUrl | string, base?: string){
    if(!url) {
      return;
    }
    if(!base) {
      return url;
    }
    if(typeof url === 'string') {
      return linkWithBase(url, base);
    } else {
      let finalUrl: IconUrl;
      Object.keys(url).forEach((k: string) => {
        const urlWithBase = getImgUrlWithBase(url[k as keyof IconUrl], base);
        if(!finalUrl) {
          if(urlWithBase) {
            finalUrl = {
              [k]:urlWithBase
            } as IconUrl
          }
        } else {
          if(urlWithBase){
            (finalUrl[k as keyof IconUrl] as IconUrl) = urlWithBase;
          }
        }
      });
      return finalUrl!;
    }
}

export function linkWithBase(link:string, base:string){
  const url = link.replace(/\/*/, '/')
  const baseUrl = base ? base.replace(/\/*$/, '') : '';
  return baseUrl + url;
}


export function linkItemsWithBase(items: UseSidebarReturnType['items'], base?:string): UseSidebarReturnType['items']{
  if(!base) {
    return items;
  }
  return items.map((item: SidebarItem) => {
    if(typeof item.link === 'string') {
      return {
        ...item,
        link:linkWithBase(item.link, base)
      }
    }
    if(Array.isArray(item.items)) {
      return {
        ...item,
        items: linkItemsWithBase(item.items as UseSidebarReturnType['items'], base)
      }
    }
    return item;
  })
}

type BacklinkSidebar = { backlink: boolean | undefined, items: SidebarItem[] }

export function sidebarItemsWithBase(sidebar: Sidebar, base?:string): Sidebar{
  if(!base) {
    return sidebar
  }
  if(Array.isArray(sidebar)) {
    return sidebar.map(item => {
      const ret = { ...item }
      if(ret.link) {
        ret.link = linkWithBase(ret.link, base);
      }

      if(Array.isArray(ret.items)) {
        ret.items = sidebarItemsWithBase(ret.items, base) as SidebarItem[];
      }

      return ret
    })
  }

  const pathKeys = Object.keys(sidebar)
  const retSidebar = {...sidebar}
  pathKeys.forEach((path:string) => {
    const sidebarItem = retSidebar[path] as BacklinkSidebar;
    if(Array.isArray(sidebarItem)){
      retSidebar[path] = sidebarItemsWithBase(sidebarItem) as SidebarItem[]
    } else {
      const { items } = sidebarItem;
      (retSidebar[path] as BacklinkSidebar).items = sidebarItemsWithBase(items) as SidebarItem[];
    }
  })
  return retSidebar;
}

export function topNavItemsWithBase(topNav: TopNav<true>, base?:string): TopNav<true>{
  if(!base) {
    return topNav
  }
  if(Array.isArray(topNav)) {
    return topNav.map(item => {
      const ret = { ...item }
      if(ret.link) {
        ret.link = linkWithBase(ret.link, base);
      }

      if(Array.isArray(ret.items)) {
        ret.items = topNavItemsWithBase(ret.items, base);
      }

      return ret
    })
  }
  return topNav;
}