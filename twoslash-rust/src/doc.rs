//! # twoslash-rust
//!
//! A Twoslash backend for Rust code, powered by `rust-analyzer`.
//!
//! This crate extracts type information, hover documentation, completions, and diagnostics
//! from Rust code for use in documentation tools. It provides the same Twoslash experience
//! that TypeScript developers enjoy, but for Rust.
//!
//! ## Overview
//!
//! Twoslash is a markup format for code samples that lets you highlight types and show
//! compiler information inline. This crate implements Twoslash for Rust by leveraging
//! `rust-analyzer`'s analysis capabilities.
//!
//! ## Query Markers
//!
//! Use these special comment markers in your Rust code to extract information:
//!
//! - `//   ^?` - Query type information at the caret position
//! - `//   ^|` - Query completions at the caret position
//!
//! ### Example
//!
//! ```text
//! let x = vec![1, 2, 3];
//! //  ^?
//! ```
//!
//! The `^?` marker will extract the type of `x` (e.g., `Vec<i32>`).
//!
//! ## Cut Markers
//!
//! Control which portion of code is shown in the final output:
//!
//! - `// ---cut---` - Hide everything before this line
//! - `// ---cut-after---` - Hide everything after this line
//!
//! This lets you include setup code (imports, type definitions) without cluttering
//! the displayed example.
//!
//! ## Modes of Operation
//!
//! ### One-off Mode
//!
//! Pipe code to stdin and receive JSON output:
//!
//! ```bash
//! echo 'let x = 42; // ^?' | twoslash-rust
//! ```
//!
//! ### Server Mode
//!
//! For better performance when processing multiple code samples, run in server mode:
//!
//! ```bash
//! TWOSLASH_SERVER_UUID=some-uuid twoslash-rust
//! ```
//!
//! The server reuses the `rust-analyzer` index between requests, dramatically
//! reducing latency for subsequent queries.
//!
//! ## CLI Options
//!
//! - `--cargo-toml <path>` - Use a custom Cargo.toml template (for external dependencies)
//! - `--target-dir <path>` - Shared target directory for caching compiled dependencies
//!
//! ## Output Format
//!
//! Returns a JSON [`TwoSlash`] result containing:
//!
//! - `code` - The processed source code (with query markers removed)
//! - `staticQuickInfos` - Type information for all identifiers
//! - `queries` - Results for explicit `^?` and `^|` markers
//! - `errors` - Compiler diagnostics
//! - `playgroundURL` - Link to Rust Playground
