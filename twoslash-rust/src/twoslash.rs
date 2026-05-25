//! Twoslash output types.
//!
//! This module contains the data structures returned by twoslash analysis,
//! including type information, diagnostics, and query results.

use ra_ide::Severity;
use serde::Serialize;

/// A highlighted region in the source code.
///
/// Highlights are typically used for syntax highlighting or
/// marking specific tokens of interest.
#[derive(Serialize)]
pub struct Highlight {
    kind: String,
    /// The index of the text in the file
    start: u32,
    /// What line is the highlighted identifier on?
    line: u32,
    /// At what index in the line does the caret represent
    offset: u32,
    /// The text of the token which is highlighted
    #[serde(skip_serializing_if = "Option::is_none")]
    text: Option<String>,
    /// The length of the token
    length: u32,
}

/// Type information for an identifier in the source code.
///
/// This is the primary output of twoslash analysis. Each `StaticQuickInfo`
/// represents hover information for a specific token, similar to what you'd
/// see when hovering over a symbol in an IDE.
///
/// # Example
///
/// For the code `let x = 42;`, you might get:
///
/// ```text
/// StaticQuickInfo {
///     target_string: "x",
///     text: "let x: i32",
///     start: 4,  // byte offset of "x"
///     length: 1,
///     ...
/// }
/// ```
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StaticQuickInfo {
    /// The string content of the node (the identifier text).
    pub target_string: String,

    /// The type signature or hover text from rust-analyzer.
    ///
    /// This is the main content you'll display to users, e.g., `let x: i32`
    /// or `fn foo(a: i32) -> String`.
    pub text: String,

    /// Documentation attached to the symbol, if any.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub docs: Option<String>,

    /// Byte offset where this token starts in the source.
    pub start: u32,

    /// Length of the token in bytes.
    pub length: u32,

    /// Line number (0-indexed) where this token is found.
    pub line: u32,

    /// Character offset within the line.
    pub character: u32,
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Serialize)]
pub enum QueryKind {
    #[serde(rename = "query")]
    Query,
    #[serde(rename = "completions")]
    Completions,
}

#[derive(Serialize)]
pub struct CompletionEntry {
    pub name: String,
}

#[derive(Serialize)]
pub struct Query {
    pub kind: QueryKind,
    /// What line is the highlighted identifier on?
    pub line: u32,
    /// At what index in the line does the caret represent
    pub offset: u32,
    /// The text of the token which is highlighted
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    /// Any attached JSDocs
    #[serde(skip_serializing_if = "Option::is_none")]
    pub docs: Option<String>,
    /// The token start which the query indicates
    pub start: u32,
    /// The length of the token
    pub length: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completions: Option<Vec<CompletionEntry>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "completionsPrefix")]
    pub completions_prefix: Option<String>,
}

#[derive(Serialize)]
pub struct Tag {
    /// What was the name of the tag
    name: String,
    /// Where was it located in the original source file
    line: u32,
    /// What was the text after the `// @tag: ` string  (optional because you could do // @tag on it's own line without the ':')
    #[serde(skip_serializing_if = "Option::is_none")]
    annotation: Option<String>,
}

#[derive(Serialize)]
pub enum DiagnosticCategory {
    #[allow(unused)]
    Debug = 0,
    Info = 1,
    #[allow(unused)]
    Warning = 2,
    Error = 3,
}

impl From<Severity> for DiagnosticCategory {
    fn from(sev: Severity) -> Self {
        match sev {
            Severity::Error => DiagnosticCategory::Error,
            Severity::Warning => DiagnosticCategory::Warning,
            Severity::WeakWarning => DiagnosticCategory::Info,
            Severity::Allow => DiagnosticCategory::Debug,
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Error {
    pub rendered_message: String,
    pub id: String,
    pub category: DiagnosticCategory,
    pub code: u32,
    pub start: u32,
    pub length: u32,
    pub line: u32,
    pub character: u32,
}

/// The complete result of analyzing a code snippet.
///
/// This is the main output type from [`analyze`](crate::analyze) and
/// [`Analyzer::analyze`](crate::Analyzer::analyze). It contains all
/// extracted type information, diagnostics, and metadata.
///
/// # Example
///
/// ```rust
/// let result = twoslash_rust::analyze(r#"
///     let numbers = vec![1, 2, 3];
///     let first = numbers.first();
/// "#, None).unwrap();
///
/// // Access type information
/// for info in &result.static_quick_infos {
///     println!("At offset {}: {}", info.start, info.text);
/// }
///
/// // Check for errors
/// if !result.errors.is_empty() {
///     eprintln!("Code has {} errors", result.errors.len());
/// }
/// ```
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TwoSlash {
    /// The analyzed source code.
    pub code: String,

    /// File extension (always "rs" for Rust).
    pub extension: String,

    /// Highlighted regions in the code.
    pub highlights: Vec<Highlight>,

    /// Type information for identifiers.
    ///
    /// This is the primary output—each entry contains the type signature
    /// and documentation for a token in the source code.
    pub static_quick_infos: Vec<StaticQuickInfo>,

    /// Results from explicit `// ^?` queries in the code.
    pub queries: Vec<Query>,

    /// Custom tags extracted from comments.
    pub tags: Vec<Tag>,

    /// Compiler errors and warnings.
    pub errors: Vec<Error>,

    /// Playground URL for this code snippet.
    #[serde(rename = "playgroundURL")]
    pub playground_url: String,
}
