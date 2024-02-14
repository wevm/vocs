import { defineConfig } from '../../src/index.js'

export default defineConfig({
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
