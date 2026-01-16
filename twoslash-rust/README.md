# twoslash-rust

Twoslash backend for Rust code, powered by `rust-analyzer`. Extracts type information, hover docs, and completions from Rust code.

## Installation

```bash
cargo install rust-twoslash
```

## Development

Build the binary:

```bash
cargo build --release
```

Use `--release` for development. `rust-analyzer` is slow at indexing sysroot in debug builds.
