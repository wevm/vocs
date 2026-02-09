//! # twoslash-rust
//!
//! Extract type information from Rust code snippets using rust-analyzer.
//!
//! This library provides [Twoslash](https://www.typescriptlang.org/dev/twoslash/)-style
//! type annotations for Rust code, enabling rich documentation with inline type hints.
//!
//! ## Quick Start
//!
//! ```rust
//! use twoslash_rust::{analyze, TwoSlash};
//!
//! let code = r#"
//!     let numbers = vec![1, 2, 3];
//!     let sum: i32 = numbers.iter().sum();
//! "#;
//!
//! let result = analyze(code, None).unwrap();
//! for info in result.static_quick_infos {
//!     println!("{}: {}", info.start, info.text);
//! }
//! ```
//!
//! ## How It Works
//!
//! 1. Your code snippet is scaffolded into a temporary Cargo project
//! 2. rust-analyzer analyzes the code and extracts type information
//! 3. Type annotations are returned with their source positions
//!
//! ## Use Cases
//!
//! - **Documentation generators**: Add hover types to code examples
//! - **Educational tools**: Show inferred types in tutorials
//! - **IDE integrations**: Extract type info for custom tooling

mod query_parser;

pub mod project;
pub mod twoslash;

pub use project::{Project, ProjectSettings};
pub use twoslash::{StaticQuickInfo, TwoSlash};

/// Analyze a code snippet and return twoslash data.
///
/// This is the main entry point for library usage. It creates a temporary
/// project, runs rust-analyzer, and extracts type information.
///
/// # Arguments
///
/// * `code` - The Rust code to analyze
/// * `cargo_toml` - Optional custom Cargo.toml content for dependencies
///
/// # Examples
///
/// Basic usage with type inference:
///
/// ```rust
/// let result = twoslash_rust::analyze(r#"
///     let greeting = "Hello, world!";
///     let len = greeting.len();
/// "#, None).unwrap();
///
/// assert!(!result.static_quick_infos.is_empty());
/// ```
///
/// With external dependencies:
///
/// ```rust,ignore
/// let cargo_toml = r#"
/// [package]
/// name = "example"
/// version = "0.1.0"
/// edition = "2021"
///
/// [dependencies]
/// serde = { version = "1.0", features = ["derive"] }
/// "#;
///
/// let code = r#"
///     use serde::{Serialize, Deserialize};
///
///     #[derive(Serialize, Deserialize)]
///     struct User {
///         name: String,
///         age: u32,
///     }
///
///     let user = User { name: "Alice".into(), age: 30 };
/// "#;
///
/// let result = twoslash_rust::analyze(code, Some(cargo_toml)).unwrap();
/// ```
pub fn analyze(code: &str, cargo_toml: Option<&str>) -> anyhow::Result<TwoSlash> {
    use tempfile::TempDir;

    let tmpdir = TempDir::new()?;
    let settings = ProjectSettings {
        project_name: "twoslash-rustdoc",
        tmpdir: &tmpdir,
        cargo_toml,
        target_dir: None,
    };

    let project = Project::scaffold_with_code(settings, code)?;
    project.twoslasher()
}

/// A reusable analyzer for processing multiple code snippets.
///
/// Use this when you need to analyze many code blocks, such as in a
/// documentation generator. The analyzer can be configured once and
/// reused across multiple calls.
///
/// # Examples
///
/// ```rust
/// use twoslash_rust::{Analyzer, AnalyzerSettings};
///
/// let mut analyzer = Analyzer::new(AnalyzerSettings {
///     cargo_toml: None,
///     target_dir: Some("/tmp/twoslash-cache".into()),
/// });
///
/// let result1 = analyzer.analyze("let x = 42;").unwrap();
/// let result2 = analyzer.analyze("let s = String::new();").unwrap();
/// ```
pub struct Analyzer {
    settings: AnalyzerSettings,
}

/// Configuration for the [`Analyzer`].
///
/// # Fields
///
/// * `cargo_toml` - Custom Cargo.toml content for dependencies
/// * `target_dir` - Directory for caching build artifacts
pub struct AnalyzerSettings {
    /// Optional custom Cargo.toml content.
    ///
    /// Use this to add dependencies your code examples need:
    ///
    /// ```rust
    /// use twoslash_rust::AnalyzerSettings;
    ///
    /// let settings = AnalyzerSettings {
    ///     cargo_toml: Some(r#"
    ///         [package]
    ///         name = "example"
    ///         version = "0.1.0"
    ///         edition = "2021"
    ///
    ///         [dependencies]
    ///         regex = "1.10"
    ///     "#.into()),
    ///     target_dir: None,
    /// };
    /// ```
    pub cargo_toml: Option<String>,

    /// Optional target directory for build artifacts.
    ///
    /// Setting this enables caching across analyzer invocations,
    /// which can significantly speed up repeated analysis.
    pub target_dir: Option<String>,
}

impl Analyzer {
    /// Create a new analyzer with the given settings.
    pub fn new(settings: AnalyzerSettings) -> Self {
        Self { settings }
    }

    /// Analyze a code snippet and extract type information.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use twoslash_rust::{Analyzer, AnalyzerSettings};
    ///
    /// let mut analyzer = Analyzer::new(AnalyzerSettings {
    ///     cargo_toml: None,
    ///     target_dir: None,
    /// });
    ///
    /// let code = r#"
    ///     fn greet(name: &str) -> String {
    ///         format!("Hello, {}!", name)
    ///     }
    ///
    ///     let message = greet("Rust");
    /// "#;
    ///
    /// let result = analyzer.analyze(code).unwrap();
    /// // result.static_quick_infos contains type info for each identifier
    /// ```
    pub fn analyze(&mut self, code: &str) -> anyhow::Result<TwoSlash> {
        analyze(code, self.settings.cargo_toml.as_deref())
    }
}
