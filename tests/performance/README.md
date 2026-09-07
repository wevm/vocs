# Production page-load regressions

```sh
pnpm install
pnpm exec playwright install chromium
pnpm test:performance
```

The runner builds a small, self-contained Vocs site and serves its **production
Node adapter output**, not Vite's development server. It runs Chromium at desktop
and mobile widths. CI also installs Chromium's OS dependencies. An existing
browser can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

The checks cover:

- A font hint present in the original response, deduplicated by React, and reused
  by CSS (one font resource).
- A real large Ruby grammar plus a uniquely marked custom grammar that work for
  server highlighting but stay out of the browser configuration.
- An initial JavaScript gzip budget of 350 KiB, measured over scripts actually
  requested by the page, without relying on generated chunk names. This has ample
  headroom for normal growth but catches a large grammar or the highlighter
  accidentally becoming eager.
- Content-column geometry before and after releasing a deliberately held font
  request. This tests the font race without depending on network speed, fixed
  sleeps, or a machine-specific load-time threshold.
- Repeat loads, client navigation, a path-aware head callback, local search, and
  Twoslash's client-side highlighting on the second page.

Each test uses a fresh browser context. The repeated-load test reloads within one
context; the delayed-font test uses request interception, which disables caching.
Only horizontal shell geometry is asserted: text can legitimately reflow with a
custom font, and these tests do not promise zero total CLS for arbitrary content.

Failures retain Playwright traces and screenshots in `test-results/`; the bundle
check also attaches per-resource gzip sizes. CI uploads these artifacts. Change
the budget only with an explanation and the attached measurements. These checks
are regression guards, not a replacement for field Core Web Vitals or broader
cross-browser testing.
