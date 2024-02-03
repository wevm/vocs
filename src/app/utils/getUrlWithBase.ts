import type { IconUrl, SidebarItem } from '../../config.js'
import type { UseSidebarReturnType } from '../hooks/useSidebar.js';


export function getUrlWithBase(url: IconUrl | string, base?: string){
    if(!url) {
      return;
    }
    if(!base) {
      return url;
    }
    if(typeof url === 'string') {
      return base + url;
    } else {
      let finalUrl: IconUrl;
      Object.keys(url).forEach((k: string) => {
        const urlWithBase = getUrlWithBase(url[k as keyof IconUrl], base);
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