# vocs

## 1.0.0-alpha.38

### Minor Changes

- [#104](https://github.com/wevm/vocs/pull/104) [`da4ee40`](https://github.com/wevm/vocs/commit/da4ee40300cfeb5028fc240daa25cef99e02dbc8) Thanks [@jxom](https://github.com/jxom)! - Added `basePath` config property to support documentation subpaths (e.g. GitHub pages, etc)

## 1.0.0-alpha.37

### Patch Changes

- [`a138c82`](https://github.com/wevm/vocs/commit/a138c82d61d7d93a5476482327e649a5b921ef88) Thanks [@jxom](https://github.com/jxom)! - Added `search-index` command to CLI to build search index separately.

## 1.0.0-alpha.36

### Minor Changes

- [`fb24c23`](https://github.com/wevm/vocs/commit/fb24c237be4e120a3da092be2d6df625cbdc34ca) Thanks [@jxom](https://github.com/jxom)! - Updated Shiki.

## 1.0.0-alpha.35

### Patch Changes

- [`a0a5776`](https://github.com/wevm/vocs/commit/a0a57764049088861b357d0ed9bf978a70226a0f) Thanks [@jxom](https://github.com/jxom)! - Fixed search index.

## 1.0.0-alpha.34

### Patch Changes

- [`7171da0`](https://github.com/wevm/vocs/commit/7171da00835060694dd57f4b1200084a639ae17d) Thanks [@jxom](https://github.com/jxom)! - Fixed SSR hydration issue in footer navigation.

## 1.0.0-alpha.33

### Minor Changes

- [#75](https://github.com/wevm/vocs/pull/75) [`1708be3`](https://github.com/wevm/vocs/commit/1708be35848ef7e0ea7faeed2f82cf998823b2b3) Thanks [@jxom](https://github.com/jxom)! - **Breaking:** Migrated to `rehype-shiki` from `rehype-pretty-code`.

  The following **meta properties** on code blocks have been removed:

  - Highlight Lines (e.g. \`\`\`js {1-3,4}).
    - Use the [inline `// [!code hl]` notation](https://vocs.dev/docs/markdown#line-highlights) instead.
  - Highlight Chars (e.g. \`\`\`js /carrot/, \`\`\`js "carrot", etc).
    - Use the [inline `// [!code word]` notation](https://vocs.dev/docs/markdown#word-focus) instead.

- [#77](https://github.com/wevm/vocs/pull/77) [`a9940fc`](https://github.com/wevm/vocs/commit/a9940fcc709cc40b2b136e14ef0ddf98d3b56755) Thanks [@jxom](https://github.com/jxom)! - Adhere to Vercel [Build Output API](https://vercel.com/docs/build-output-api/v3) for zero-config Vercel deployments.

- [#75](https://github.com/wevm/vocs/pull/75) [`1708be3`](https://github.com/wevm/vocs/commit/1708be35848ef7e0ea7faeed2f82cf998823b2b3) Thanks [@jxom](https://github.com/jxom)! - Migrated from `shikiji@0.10` to `shiki@1.0.0-beta`.

### Patch Changes

- [`bd341b6`](https://github.com/wevm/vocs/commit/bd341b61e9410cdc5cce73a5e81354bdaec524a8) Thanks [@jxom](https://github.com/jxom)! - Fixed last updated timestamp hydration mismatch issue.

## 1.0.0-alpha.32

### Patch Changes

- [`957d228`](https://github.com/wevm/vocs/commit/957d228dc2723a63e302374f780e2d26b4c73aff) Thanks [@jxom](https://github.com/jxom)! - Fixed `showLineNumbers` issues. See #55.

- Updated dependencies [[`957d228`](https://github.com/wevm/vocs/commit/957d228dc2723a63e302374f780e2d26b4c73aff)]:
  - create-vocs@1.0.0-alpha.4

## 1.0.0-alpha.31

### Patch Changes

- [#59](https://github.com/wevm/vocs/pull/59) [`ca6b2f0`](https://github.com/wevm/vocs/commit/ca6b2f0e398821219fb8bd488b26c40036ef4314) Thanks [@Maidang1](https://github.com/Maidang1)! - Fixed last updated timestamp when git is not detected.

## 1.0.0-alpha.30

### Patch Changes

- [#38](https://github.com/wevm/vocs/pull/38) [`0a58102`](https://github.com/wevm/vocs/commit/0a581021838be6f708ddab06fd374ad87643fc72) Thanks [@tmm](https://github.com/tmm)! - Added last updated at timestamp.

- [`272c8ed`](https://github.com/wevm/vocs/commit/272c8ed5c65ffa9db33f4bf2cfc59bb858581e8b) Thanks [@jxom](https://github.com/jxom)! - Fixed search rendering twoslash.

- [`272c8ed`](https://github.com/wevm/vocs/commit/272c8ed5c65ffa9db33f4bf2cfc59bb858581e8b) Thanks [@jxom](https://github.com/jxom)! - Fixed rendering of date on blog posts.

## 1.0.0-alpha.29

### Patch Changes

- [`d6d265e`](https://github.com/wevm/vocs/commit/d6d265edb1d45ebfd5040a02c00d4f80cb3a3882) Thanks [@jxom](https://github.com/jxom)! - Updated Twoslash & Shikiji.

## 1.0.0-alpha.28

### Minor Changes

- [`dde372d`](https://github.com/wevm/vocs/commit/dde372db34bf7f33f8c5ce86b691d0bbc5c38c46) Thanks [@jxom](https://github.com/jxom)! - Added support for "virtual file" code snippets.

## 1.0.0-alpha.27

### Patch Changes

- [`84d2f8a`](https://github.com/wevm/vocs/commit/84d2f8a4debf9c0059fee2dbdfc5a3c07448b8c1) Thanks [@jxom](https://github.com/jxom)! - Upgraded `@vanilla-extract/vite-plugin`.

- [`caab637`](https://github.com/wevm/vocs/commit/caab63709559c9105528338bfce6b39e6f4cd324) Thanks [@jxom](https://github.com/jxom)! - Modified styling of inline code headings.

## 1.0.0-alpha.26

### Patch Changes

- [`a526367`](https://github.com/wevm/vocs/commit/a5263674c5e7135f0d8325fcc04bd2148e2e7688) Thanks [@jxom](https://github.com/jxom)! - Migrated from `@popperjs/core` to `@floating-ui/react`.

## 1.0.0-alpha.25

### Minor Changes

- [`fbe32fd`](https://github.com/wevm/vocs/commit/fbe32fd9713bbc3fb8a6b81c7cd615aacb08979e) Thanks [@jxom](https://github.com/jxom)! - Added "find and replace" syntax to the \`// [!include]\` marker (code snippets).

## 1.0.0-alpha.24

### Major Changes

- [#40](https://github.com/wevm/vocs/pull/40) [`41ba59f`](https://github.com/wevm/vocs/commit/41ba59faf015909bd398ce75767ce61035245132) Thanks [@jxom](https://github.com/jxom)! - **Breaking:** Removed the `::snip` directive. Use the `// [!include]` marker instead. [See more.](https://vocs.dev/docs/guides/code-snippets)

### Minor Changes

- [#40](https://github.com/wevm/vocs/pull/40) [`41ba59f`](https://github.com/wevm/vocs/commit/41ba59faf015909bd398ce75767ce61035245132) Thanks [@jxom](https://github.com/jxom)! - Added support for [regions in code snippets](https://vocs.dev/docs/guides/code-snippets#regions).

## 1.0.0-alpha.23

### Patch Changes

- [`7cee08d`](https://github.com/wevm/vocs/commit/7cee08d039ee0ecff2396375056ecc5a9732bf86) Thanks [@jxom](https://github.com/jxom)! - Fixed mobile top nav text wrapping on small devices - fixes #37.

## 1.0.0-alpha.22

### Patch Changes

- [`0a139e3`](https://github.com/wevm/vocs/commit/0a139e3374b82342256cbcc98d9504599eacc185) Thanks [@jxom](https://github.com/jxom)! - Added support for \`// [!code word]\` in code blocks. See more: https://shikiji.netlify.app/packages/transformers#transformernotationwordhighlight

## 1.0.0-alpha.21

### Patch Changes

- [`47e6b4f`](https://github.com/wevm/vocs/commit/47e6b4f26327d0cffa4ef0f072d447c7ec87aae9) Thanks [@jxom](https://github.com/jxom)! - Fixed scroll restoration.

## 1.0.0-alpha.20

### Patch Changes

- [`67ccd24`](https://github.com/wevm/vocs/commit/67ccd24ab8b050bee6465b7b81ed30fe06fdfd4f) Thanks [@jxom](https://github.com/jxom)! - Tweaked sidebar styling.

## 1.0.0-alpha.19

### Minor Changes

- [`fc1c9e6`](https://github.com/wevm/vocs/commit/fc1c9e6fa31e27ceeaa85f672ef53a5691071c98) Thanks [@jxom](https://github.com/jxom)! - Upgraded to Shikiji v0.10

## 1.0.0-alpha.18

### Patch Changes

- [`734aa3b`](https://github.com/wevm/vocs/commit/734aa3b1b5ed239a0a03710eb5a402380c471895) Thanks [@jxom](https://github.com/jxom)! - Added functionality to preload pages when link comes into view.

## 1.0.0-alpha.17

### Patch Changes

- [`8e977c0`](https://github.com/wevm/vocs/commit/8e977c013bfc7c2d5b59608b2d0f7920712f18ef) Thanks [@jxom](https://github.com/jxom)! - Tweaked twoslash styles.

- [`59bb979`](https://github.com/wevm/vocs/commit/59bb97958ce84c1959c6ffcc5121d6a4a37af652) Thanks [@jxom](https://github.com/jxom)! - Shrinked indentation on Twoslash popup code snippets.

## 1.0.0-alpha.16

### Patch Changes

- [`97c3fdd`](https://github.com/wevm/vocs/commit/97c3fdd461315130e321fc02d0d062c45fe23252) Thanks [@jxom](https://github.com/jxom)! - Tweaked twoslash styles

## 1.0.0-alpha.15

### Patch Changes

- [`595c932`](https://github.com/wevm/vocs/commit/595c932500fbcc731ba8ddeb8477da3afabcfb9a) Thanks [@jxom](https://github.com/jxom)! - Improved banner & bottom navigation styling.

- [`c5c17c4`](https://github.com/wevm/vocs/commit/c5c17c470b0e4ac8b2f146f3f76f4bf54609971b) Thanks [@jxom](https://github.com/jxom)! - Added `textColor` property to `banner` in Vocs config.

## 1.0.0-alpha.14

### Patch Changes

- [`1ca1f97`](https://github.com/wevm/vocs/commit/1ca1f97a2bfa7b68e7ed878afe1658ab18b32755) Thanks [@jxom](https://github.com/jxom)! - Downgraded Shikiji to 0.9.19 (for now).

## 1.0.0-alpha.13

### Patch Changes

- [`73556bc`](https://github.com/wevm/vocs/commit/73556bca69f7a1100bcab16d896a1779e323436f) Thanks [@jxom](https://github.com/jxom)! - Improved code block styling in callouts.

## 1.0.0-alpha.12

### Patch Changes

- [`b58217c`](https://github.com/wevm/vocs/commit/b58217ccca8376f42564940df901d11eda2ef906) Thanks [@jxom](https://github.com/jxom)! - Fixed google fonts.

## 1.0.0-alpha.11

### Major Changes

- [`15b4ac9`](https://github.com/wevm/vocs/commit/15b4ac9892c7d351d841b1b6776d0cc78f0c9026) Thanks [@jxom](https://github.com/jxom)! - **Breaking:** Renamed `twoslash.defaultCompilerOptions` to `twoslash.compilerOptions` in the Vocs config.

### Minor Changes

- [`15b4ac9`](https://github.com/wevm/vocs/commit/15b4ac9892c7d351d841b1b6776d0cc78f0c9026) Thanks [@jxom](https://github.com/jxom)! - Updated Shikiji to `0.10.0-beta.1`.

- [`db95f75`](https://github.com/wevm/vocs/commit/db95f75710c2d027e25ff8c068455a11a5e4d8ec) Thanks [@jxom](https://github.com/jxom)! - Added `banner` property to the Vocs config.

### Patch Changes

- [`15b4ac9`](https://github.com/wevm/vocs/commit/15b4ac9892c7d351d841b1b6776d0cc78f0c9026) Thanks [@jxom](https://github.com/jxom)! - Decreased code block font size to 14px.

- [`15b4ac9`](https://github.com/wevm/vocs/commit/15b4ac9892c7d351d841b1b6776d0cc78f0c9026) Thanks [@jxom](https://github.com/jxom)! - Added JSDoc to Twoslash snippets.

- [`738864d`](https://github.com/wevm/vocs/commit/738864df5304e68827b9d9af2ccc4502d4ace74a) Thanks [@jxom](https://github.com/jxom)! - Fixed Twoslash leaking into clipboard.

- [`0f10595`](https://github.com/wevm/vocs/commit/0f105951bb40547077dba0c3d693b24775803813) Thanks [@jxom](https://github.com/jxom)! - Added external link arrow.

## 1.0.0-alpha.10

### Patch Changes

- [`b1fec40`](https://github.com/wevm/vocs/commit/b1fec40385ec4762d81e39b1e55937dddc3c2047) Thanks [@jxom](https://github.com/jxom)! - Fixed @mdx-js/react import.

## 1.0.0-alpha.9

### Patch Changes

- [`9742f19`](https://github.com/wevm/vocs/commit/9742f19461a8de9e27a27a7146d649fdccf2be1f) Thanks [@jxom](https://github.com/jxom)! - Fixed top nav styles.

## 1.0.0-alpha.8

### Patch Changes

- [`3a9b4e9`](https://github.com/wevm/vocs/commit/3a9b4e926e6e84096b1e85ffa33975f88b1bb7b4) Thanks [@jxom](https://github.com/jxom)! - Fixed components in MDX snippets.

## 1.0.0-alpha.7

### Patch Changes

- [`861e632`](https://github.com/wevm/vocs/commit/861e632ed2844438f4b89703d7e051cb7a73cd48) Thanks [@jxom](https://github.com/jxom)! - Added Telegram social.

- [`46dd001`](https://github.com/wevm/vocs/commit/46dd00158de560012be1dacbdd2c3340f59d575d) Thanks [@jxom](https://github.com/jxom)! - Added `twitter:image` meta tag.

- [`5c9639a`](https://github.com/wevm/vocs/commit/5c9639a8143a08c083571a333e6a35ed3e93aa41) Thanks [@jxom](https://github.com/jxom)! - Fixed code group titles.

## 1.0.0-alpha.6

### Patch Changes

- [`2bb7566`](https://github.com/wevm/vocs/commit/2bb7566574bc439325820f004b75f530b9a17e42) Thanks [@jxom](https://github.com/jxom)! - Fixed head tags.

## 1.0.0-alpha.5

### Patch Changes

- [`28d09f1`](https://github.com/wevm/vocs/commit/28d09f13e629562f2627f7d6c2cddcc64d6834de) Thanks [@jxom](https://github.com/jxom)! - Fixed top nav styling.

- Updated dependencies [[`28d09f1`](https://github.com/wevm/vocs/commit/28d09f13e629562f2627f7d6c2cddcc64d6834de)]:
  - create-vocs@1.0.0-alpha.3

## 1.0.0-alpha.4

### Minor Changes

- [`3e717c5`](https://github.com/wevm/vocs/commit/3e717c5288c2d58b37970d64bc57a868f72b6741) Thanks [@jxom](https://github.com/jxom)! - Added \`vite\` property to Vocs configuration.

### Patch Changes

- Updated dependencies [[`3e717c5`](https://github.com/wevm/vocs/commit/3e717c5288c2d58b37970d64bc57a868f72b6741)]:
  - create-vocs@1.0.0-alpha.2

## 1.0.0-alpha.3

### Patch Changes

- [`a36ebbf`](https://github.com/wevm/vocs/commit/a36ebbff9c1ec17cf8ff14689fa2d6d3e283a401) Thanks [@jxom](https://github.com/jxom)! - Tweaked home page styling.

## 1.0.0-alpha.2

### Patch Changes

- [`6a82858`](https://github.com/wevm/vocs/commit/6a82858824ba9fe6f3da30cc35937a4b99a95ed2) Thanks [@jxom](https://github.com/jxom)! - Fixed site description.

## 1.0.0-alpha.1

### Patch Changes

- Initial release

- Updated dependencies []:
  - create-vocs@1.0.0-alpha.1

## 1.0.0-alpha.0

### Major Changes

- [`4226240`](https://github.com/wevm/vocs/commit/4226240f0e70fefb2059cb599bda478bb8eb268c) Thanks [@jxom](https://github.com/jxom)! - Initial release

### Patch Changes

- Updated dependencies [[`4226240`](https://github.com/wevm/vocs/commit/4226240f0e70fefb2059cb599bda478bb8eb268c)]:
  - create-vocs@1.0.0-alpha.0
