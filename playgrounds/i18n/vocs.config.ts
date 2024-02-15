import { defineConfig } from '../../src/index.js'

export default defineConfig({
  editLink: {
    // NOTE: the order is important
    '/': {
      pattern: 'https://github.com/wagmi-dev/vocs/edit/main/site/pages/:path',
      text: 'Suggest changes to this page',
      // Optional
      // lastUpdated: 'Last updated'
    },
    '/zh': {
      pattern: 'https://github.com/wagmi-dev/vocs/edit/main/site/pages/:path',
      text: '建议对此页面进行更改',
      lastUpdated: '最后更新时间',
    },
  },
  footerNav: {
    // NOTE: the order is important
    '/': {
      previous: 'Previous',
      next: 'Next',
    },
    '/zh': {
      previous: '以前的',
      next: '下一个',
    },
  },
  search: {
    // NOTE: the order is important
    '/': {
      placeholder: 'Search',
      navigate: 'Navigate',
      select: 'Select',
      close: 'Close',
      reset: 'Reset',
      noResults: 'No results for',
      labelClose: 'Close search dialog',
    },
    '/zh': {
      placeholder: '搜索',
      navigate: '导航',
      select: '选择',
      close: '关闭',
      reset: '重置',
      noResults: '没有结果',
      labelClose: '关闭搜索对话框',
    },
  },
  sidebar: {
    // NOTE: the order is important
    '/': [
      {
        text: 'Overview',
        link: '/',
      },
      {
        text: 'Example',
        items: [
          {
            text: 'Translated',
            link: '/translated',
          },
        ],
      },
    ],
    '/zh': [
      {
        text: '概述',
        link: '/zh',
      },
      {
        text: '例子',
        items: [
          {
            text: '已翻译',
            link: '/zh/translated',
          },
        ],
      },
    ],
  },
  defaultLocale: {
    label: 'English',
    lang: 'en',
  },
  locales: {
    something: {
      label: '简体中文',
      lang: 'zh',
    },
  },
  title:
    // NOTE: the order is important
    {
      '/': 'i18n',
      '/zh': 'i18n 中文',
    },
  description:
    // NOTE: the order is important and this will show up when mdx description not defined
    {
      '/': 'English description',
      '/zh': '中文说明',
    },
  topNav: {
    '/': [
      {
        text: 'Overview',
        link: '/',
      },
      {
        text: 'Example',
        items: [
          {
            text: 'Translated',
            link: '/translated',
          },
        ],
      },
    ],
    '/zh': [
      {
        text: '概述',
        link: '/zh',
      },
      {
        text: '例子',
        items: [
          {
            text: '已翻译',
            link: '/zh/translated',
          },
        ],
      },
    ],
  },
})
