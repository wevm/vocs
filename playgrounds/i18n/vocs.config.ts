import { defineConfig } from "../../src/index.js";

export default defineConfig({
  sidebar: {
    // NOTE: the order is important
    "/": [
      {
        text: "Overview",
        link: "/",
      },
      {
        text: "Example",
        items: [
          {
            text: "Translated",
            link: "/translated",
          },
        ],
      },
    ],
    "/zh": [
      {
        text: "概述",
        link: "/zh",
      },
      {
        text: "例子",
        items: [
          {
            text: "已翻译",
            link: "/zh/translated",
          },
        ],
      },
    ],
  },
  defaultLocale: {
    label: "English",
    lang: "en",
  },
  locales: {
    something: {
      label: "简体中文",
      lang: "zh",
    },
  },
  title: "i18n",
  //   topNav: {
  //     '/': [
  //     {
  //       tsext: "Company",
  //       items: [
  //         {
  //           text: "About",
  //           link: "/about",
  //         },
  //         {
  //           text: "Blog",
  //           link: "/about",
  //         },
  //         {
  //           text: "Careers",
  //           link: "/about",
  //         },
  //       ],
  //     },
  //   ]
  // }
});
