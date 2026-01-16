# twoslash-rust

This is a backend for [twoslash](https://github.com/shikijs/twoslash) that
supports annotating Rust code.

For usage information, see [`js/index.ts`](./js/index.ts). Right now you will
need to install the TypeScript/JavaScript client from this git repo directly.
You will also need the `twoslash-rust` binary (which is effectively a shell over
rust-analyzer), which you can get via `cargo install rust-twoslash --git https://github.com/ayazhafiz/twoslash-rust.git`.

## Development

Make sure to clone rust-analyzer as a submodule. I couldn't get recent releases
of rust-analyzer on crates.io to compile, so we're doing submodules for now.

You're best off developing with `--release`. Turns out rust-analyzer is really
slow at indexing sysroot in debug builds.
