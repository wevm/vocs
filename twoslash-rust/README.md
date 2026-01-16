# twoslash-rust

Twoslash backend for Rust code, powered by `rust-analyzer`. Extracts type information, hover docs, and completions from Rust code.

## Installation

```bash
cargo install twoslash-rust
```

## Usage

Pipe Rust code to the binary via stdin:

```bash
echo 'fn main() { let x = 42; }' | twoslash-rust
```

Output is JSON with type information:

```json
{
  "hovers": [
    {
      "text": "i32",
      "line": 0,
      "character": 16,
      "length": 1
    }
  ],
  "queries": [],
  "completions": [],
  "highlights": [],
  "errors": []
}
```

Use twoslash query markers (`//  ^?`) to extract types at specific positions:

```bash
echo 'fn main() {
  let x = 42;
//    ^?
}' | twoslash-rust
```

### Options

- `--cargo-toml <path>` — Use a custom `Cargo.toml` for dependencies
- `--target-dir <path>` — Specify a custom target directory for caching

### Server Mode

Set `TWOSLASH_SERVER_UUID` to run as a persistent TCP server for faster repeated queries:

```bash
TWOSLASH_SERVER_UUID=abc123 twoslash-rust
# Outputs: 127.0.0.1:<port>
```

## Development

Build the binary:

```bash
cargo build --release
```

Use `--release` for development. `rust-analyzer` is slow at indexing sysroot in debug builds.
