use ra_ide::Severity;
use serde::Serialize;

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

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StaticQuickInfo {
    /// The string content of the node this represents (mainly for debugging)
    pub target_string: String,
    /// The base LSP response (the type)
    pub text: String,
    /// Attached JSDoc info
    #[serde(skip_serializing_if = "Option::is_none")]
    pub docs: Option<String>,
    /// The index of the text in the file
    pub start: u32,
    /// how long the identifier
    pub length: u32,
    /// line number where this is found
    pub line: u32,
    /// The character on the line
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

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TwoSlash {
    pub code: String,
    pub extension: String,
    /// Requests to highlight a particular part of the code
    pub highlights: Vec<Highlight>,
    /// An array of LSP responses identifiers in the sample
    pub static_quick_infos: Vec<StaticQuickInfo>,
    /// Requests to use the LSP to get info for a particular symbol in the source
    pub queries: Vec<Query>,
    /// The extracted twoslash commands for any custom tags passed in via customTags
    pub tags: Vec<Tag>,
    /// Diagnostic error messages which came up when creating the program
    pub errors: Vec<Error>,
    /// The URL for this sample in the playground
    #[serde(rename = "playgroundURL")]
    pub playground_url: String,
}
