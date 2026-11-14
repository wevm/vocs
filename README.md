# Vocs next

Documentation that readers talk to. A [nanocode](https://nanocode.xyz) agent in the reader's page searches the site's sources, then answers in chat or generates a page of typed blocks.

This branch is a rewrite in progress. The current Vocs ships from [`main`](https://github.com/wevm/vocs/tree/main).

- Design and public API: [`.agents/design.md`](./.agents/design.md)
- Implementation plan: [`.agents/plan.md`](./.agents/plan.md)
- Contributor and agent conventions: [`AGENTS.md`](./AGENTS.md)

## Development

```sh
pnpm install
pnpm check        # format and lint with Vite+
pnpm check:types  # TypeScript 7
pnpm test         # integration suites
pnpm build        # zile
```

## License

[MIT](./LICENSE)
