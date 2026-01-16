use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::process::Command;

use anyhow::Result;

use camino::Utf8PathBuf;
use load_cargo::{load_workspace, LoadCargoConfig, ProcMacroServerChoice};
use ra_ide::{
    Analysis, AnalysisHost, AssistResolveStrategy, CompletionConfig, CompletionFieldsToResolve,
    Diagnostic, DiagnosticsConfig, FileId, FilePosition, HoverResult, LineCol, LineIndex,
    StaticIndex, TextRange, TextSize, TokenId, TokenStaticData, VendoredLibrariesConfig,
};
use ra_ide_db::imports::insert_use::{ImportGranularity, InsertUseConfig, PrefixKind};
use ra_ide_db::{ChangeWithProcMacros, MiniCore, SnippetCap};
use ra_project_model::{CargoConfig, ProjectManifest, ProjectWorkspace, RustLibSource};
use ra_vfs::{AbsPathBuf, VfsPath};
use tempfile::TempDir;

use crate::query_parser::find_queries;
use crate::twoslash::{CompletionEntry, Error, Query, QueryKind, StaticQuickInfo, TwoSlash};

#[derive(Clone)]
pub struct ProjectSettings<'a> {
    pub project_name: &'a str,
    pub tmpdir: &'a TempDir,
    /// Optional Cargo.toml content to use as template
    pub cargo_toml: Option<&'a str>,
    /// Optional shared target directory for caching compiled deps
    pub target_dir: Option<&'a str>,
}

struct Position {
    start: u32,
    length: u32,
    line: u32,
    character: u32,
}

pub struct Project {
    cut: Cut,

    host: Option<AnalysisHost>,
    analysis: Analysis,
    queries: Vec<(QueryKind, TextSize)>,

    line_index: LineIndex,
    token_to_ranges: HashMap<TokenId, Vec<TextRange>>,
    token_data: Vec<(TokenId, TokenStaticData)>,

    fid: FileId,
}

/// Result of bootstrapping a cargo project
struct BootstrapResult {
    root: PathBuf,
    lib_rs: PathBuf,
}

/// Generate default Cargo.toml content
fn default_cargo_toml(project_name: &str) -> String {
    format!(
        r#"[package]
edition = "2021"
name = "{}"
version = "0.0.0"
"#,
        project_name,
    )
}

/// Bootstraps a cargo project in a directory, and returns the paths of the
/// project root and lib.rs.
fn bootstrap_project_in(
    dir: &TempDir,
    project_name: &str,
    source: &str,
    cargo_toml_template: Option<&str>,
    target_dir: Option<&str>,
) -> Result<BootstrapResult> {
    let root = dir.path();
    let lib_rs = root.join("src/lib.rs");

    // /root
    // |- Cargo.toml
    // |- src
    //    |- lib.rs
    let cargo_toml_path = root.join("Cargo.toml");

    let cargo_content = match cargo_toml_template {
        Some(template) => template.to_string(),
        None => default_cargo_toml(project_name),
    };

    fs::write(cargo_toml_path, cargo_content.trim())?;
    fs::create_dir(root.join("src"))?;
    fs::write(lib_rs.clone(), source)?;

    // Always run cargo check to fetch deps and set up sysroot for rust-analyzer
    let mut cmd = Command::new("cargo");
    cmd.args(["check"]).current_dir(root);

    // Use shared target directory if provided (caches compiled deps across runs)
    if let Some(target) = target_dir {
        fs::create_dir_all(target)?;
        cmd.arg("--target-dir").arg(target);
    }

    cmd.output()?;

    Ok(BootstrapResult {
        root: root.to_path_buf(),
        lib_rs,
    })
}

fn pre_index(
    analysis: &Analysis,
    fid: FileId,
    source: &str,
) -> (
    HashMap<TokenId, Vec<TextRange>>,
    Vec<(TokenId, TokenStaticData)>,
    LineIndex,
    Cut,
) {
    let si = StaticIndex::compute(&analysis, VendoredLibrariesConfig::Excluded);

    let mut token_to_ranges = HashMap::<TokenId, Vec<TextRange>>::default();
    for (range, id) in si
        .files
        .iter()
        .find(|fi| fi.file_id == fid)
        .unwrap()
        .tokens
        .iter()
    {
        token_to_ranges.entry(*id).or_default().push(*range);
    }
    let token_data = si.tokens.iter().collect();

    let line_index = LineIndex::new(source);
    let cut = Cut::new(source, &line_index);

    (token_to_ranges, token_data, line_index, cut)
}

impl Project {
    pub fn scaffold(settings: ProjectSettings) -> Result<Project> {
        Self::scaffold_with_code(
            settings,
            // Basis code for scaffolding
            r#"pub fn foo() -> usize { 1 }"#,
        )
    }

    /// Like `scaffold`, but injects user code immediately.
    pub fn scaffold_with_code<'a>(settings: ProjectSettings, source: &'a str) -> Result<Project> {
        let parse_result = find_queries(source);
        let source = parse_result.code;
        let queries = parse_result.queries;

        // Always use cargo mode - it's needed for std resolution and external deps
        let bootstrap = bootstrap_project_in(
            settings.tmpdir,
            settings.project_name,
            &source,
            settings.cargo_toml,
            settings.target_dir,
        )?;

        let cargo_config = CargoConfig {
            sysroot: Some(RustLibSource::Discover),
            ..CargoConfig::default()
        };
        let no_progress = &|_| ();
        let load_cargo_config = LoadCargoConfig {
            load_out_dirs_from_check: true,
            with_proc_macro_server: ProcMacroServerChoice::None,
            prefill_caches: false,
        };
        let path = AbsPathBuf::assert_utf8(Utf8PathBuf::try_from(bootstrap.root).unwrap().into());

        let manifest = ProjectManifest::discover_single(&path)?;
        let workspace = ProjectWorkspace::load(manifest, &cargo_config, no_progress)?;
        let (db, vfs, _proc_macro) =
            load_workspace(workspace, &cargo_config.extra_env, &load_cargo_config)?;
        let host = AnalysisHost::with_database(db);

        let analysis = host.analysis();

        let _si = StaticIndex::compute(&analysis, VendoredLibrariesConfig::Excluded);

        let (fid, _) = vfs
            .file_id(&VfsPath::new_real_path(
                bootstrap.lib_rs.display().to_string(),
            ))
            .unwrap();
        let analysis = host.analysis();

        let (token_to_ranges, token_data, line_index, cut) = pre_index(&analysis, fid, &source);

        Ok(Project {
            cut,

            host: Some(host),
            analysis,
            queries,

            line_index,
            token_to_ranges,
            token_data,

            fid,
        })
    }

    pub fn apply_change(self, new_code: String) -> Self {
        // The analysis is now stale. Drop it so that we don't block host update below.
        drop(self.analysis);

        let parse_result = find_queries(&new_code);
        let new_code = parse_result.code;
        let queries = parse_result.queries;

        let (host, analysis, fid) = match self.host {
            Some(mut host) => {
                let mut changes = ChangeWithProcMacros::default();
                changes.change_file(self.fid, Some(new_code.clone()));
                host.apply_change(changes);
                let analysis = host.analysis();
                (Some(host), analysis, self.fid)
            }
            None => {
                // This is a standalone rust script.
                let (analysis, fid) = Analysis::from_single_file(new_code.clone());
                (None, analysis, fid)
            }
        };

        let (token_to_ranges, token_data, line_index, cut) = pre_index(&analysis, fid, &new_code);

        Self {
            host,
            analysis,
            queries,
            fid,
            token_to_ranges,
            token_data,
            line_index,
            cut,
        }
    }

    /// Returns the TS-style position from this range, or `None` if the range should not be
    /// considered (because it is outside the cut range).
    fn to_position(&self, range: TextRange) -> Option<Position> {
        let (start, end) = (range.start(), range.end());
        let LineCol {
            line,
            col: character,
        } = self.line_index.line_col(start);
        match self.cut.line_in_cut(line) {
            true => Some(Position {
                start: u32::from(start) - self.cut.start_offset,
                length: (end - start).into(),
                line: line - self.cut.start_line,
                character,
            }),
            false => None,
        }
    }

    fn diagnostics(&self) -> Result<Vec<Error>> {
        let diags = self
            .analysis
            .full_diagnostics(
                &DiagnosticsConfig::test_sample(),
                AssistResolveStrategy::None,
                self.fid,
            )?
            .into_iter()
            .filter_map(|diag| {
                let Diagnostic {
                    code,
                    message,
                    range,
                    severity,
                    ..
                } = diag;
                self.to_position(range.range).map(
                    |Position {
                         start,
                         length,
                         line,
                         character,
                     }| {
                        Error {
                            code: 0,
                            id: code.as_str().to_string(),
                            rendered_message: message,
                            category: severity.into(),
                            start,
                            length,
                            line,
                            character,
                        }
                    },
                )
            })
            .collect();
        Ok(diags)
    }

    fn ident_hovers(&self) -> Result<Vec<StaticQuickInfo>> {
        let hovers = self
            .token_data
            .iter()
            .filter_map(|(id, token)| token.hover.as_ref().map(|hover| (id, hover)))
            .flat_map(|(id, hover): (&TokenId, &HoverResult)| {
                self.token_to_ranges
                    .get(&id)
                    .map(|ranges| {
                        // Annoying, but we have to do this here. We can't unwrap_or_default first
                        // because then we take a reference to a Vec, and rustc thinks we return
                        // meaningful data inside that temporary.
                        ranges
                            .iter()
                            .map(|range| (range, hover))
                            .collect::<Vec<_>>()
                    })
                    .unwrap_or_default()
            })
            .filter_map(|(range, hover)| {
                self.to_position(*range).map(
                    |Position {
                         start,
                         length,
                         line,
                         character,
                     }| {
                        let target_string = self.cut.source
                            [(start as usize)..((start + length) as usize)]
                            .to_string();

                        let markup = hover.markup.to_string();
                        let text = ra_hover_to_text(markup);

                        StaticQuickInfo {
                            target_string,
                            text,
                            docs: None,
                            start,
                            length,
                            line,
                            character,
                        }
                    },
                )
            })
            .collect();
        Ok(hovers)
    }

    fn find_hover_data_at_position(&self, pos: TextSize) -> Option<(TextRange, &HoverResult)> {
        // Find all tokens containing this position, then pick the smallest (most specific) one
        let mut candidates: Vec<(TextRange, &HoverResult)> = self
            .token_data
            .iter()
            .filter_map(|(id, data)| {
                let range = self
                    .token_to_ranges
                    .get(id)
                    .and_then(|ranges| ranges.iter().find(|range| range.contains(pos)));
                match (range, data.hover.as_ref()) {
                    (Some(range), Some(hover)) => Some((*range, hover)),
                    _ => None,
                }
            })
            .collect();

        // Sort by range length (smallest first) to get the most specific token
        candidates.sort_by_key(|(range, _)| range.len());
        candidates.into_iter().next()
    }

    fn query(&self, pos: TextSize) -> Result<Query> {
        let (range, info) = match self.find_hover_data_at_position(pos) {
            None => return Err(anyhow::Error::msg("")),
            Some(info) => info,
        };
        let Position {
            start,
            length,
            line,
            character,
        } = match self.to_position(range) {
            None => return Err(anyhow::Error::msg("")),
            Some(pos) => pos,
        };

        let markup = info.markup.to_string();
        let text = ra_hover_to_text(markup);

        Ok(Query {
            kind: QueryKind::Query,
            line: line + 1,
            offset: character,
            text: Some(text),
            docs: None,
            start,
            length,
            completions: None,
            completions_prefix: None,
        })
    }

    fn completions(&self, pos: TextSize) -> Result<Query> {
        let completions_config = CompletionConfig {
            enable_postfix_completions: true,
            enable_imports_on_the_fly: true,
            enable_self_on_the_fly: true,
            enable_auto_iter: true,
            enable_auto_await: true,
            enable_private_editable: true,
            enable_term_search: false,
            term_search_fuel: 200,
            full_function_signatures: false,
            callable: None,
            add_semicolon_to_unit: false,
            snippet_cap: SnippetCap::new(true),
            insert_use: InsertUseConfig {
                granularity: ImportGranularity::Crate,
                prefix_kind: PrefixKind::Plain,
                enforce_granularity: true,
                group: true,
                skip_glob_imports: true,
            },
            prefer_no_std: false,
            prefer_prelude: true,
            prefer_absolute: false,
            snippets: Vec::new(),
            limit: None,
            fields_to_resolve: CompletionFieldsToResolve::empty(),
            exclude_flyimport: Vec::new(),
            exclude_traits: &[],
            minicore: MiniCore::default(),
        };
        let file_pos = FilePosition {
            file_id: self.fid,
            offset: pos,
        };
        let completions = self
            .analysis
            .completions(&completions_config, file_pos, None)?;
        let zero_err = Err(anyhow::Error::msg(""));
        let completions = match completions {
            None => return zero_err,
            Some(info) if info.is_empty() => return zero_err,
            Some(info) => info,
        };

        let Position {
            start,
            length,
            line,
            character,
        } = match self.to_position(completions[0].source_range) {
            None => return zero_err,
            Some(pos) => pos,
        };

        let target_string =
            self.cut.source[(start as usize)..((start + length) as usize)].to_string();

        let completions = completions
            .into_iter()
            .map(|completion| CompletionEntry {
                name: completion.label.primary.to_string(),
            })
            .collect();

        Ok(Query {
            kind: QueryKind::Query,
            line,
            offset: character,
            text: None,
            docs: None,
            start,
            length,
            completions: Some(completions),
            completions_prefix: Some(target_string),
        })
    }

    fn queries(&self) -> Vec<Query> {
        self.queries
            .iter()
            .filter_map(|(kind, pos)| {
                match kind {
                    QueryKind::Query => self.query(*pos),
                    QueryKind::Completions => self.completions(*pos),
                }
                .ok()
            })
            .collect()
    }

    pub fn twoslasher(&self) -> Result<TwoSlash> {
        let errors = self.diagnostics()?;
        let static_quick_infos = self.ident_hovers()?;
        let queries = self.queries();

        let two_slash_result = TwoSlash {
            code: self.cut.source.to_string(),
            extension: ".rs".to_string(),
            highlights: vec![],
            static_quick_infos,
            queries,
            // TODO: real tags
            tags: vec![],
            errors,
            // TODO: real URL
            playground_url: "https://play.rust-lang.org".to_string(),
        };
        Ok(two_slash_result)
    }
}

struct Cut {
    source: String,
    start_line: u32,
    start_offset: u32,
    end_line: u32,
}

impl Cut {
    fn new(basis: &str, line_index: &LineIndex) -> Cut {
        static CUT_BEFORE_STR: &'static str = "// ---cut---\n";
        static CUT_AFTER_STR: &'static str = "// ---cut-after---\n";

        let (start_line, start_offset) = basis
            .find(CUT_BEFORE_STR)
            .map(|offset| {
                let LineCol { line, .. } = line_index.line_col(TextSize::from(offset as u32));
                let start_line = line + 1;
                let start_offset = (offset + CUT_BEFORE_STR.len()) as u32;
                (start_line, start_offset)
            })
            .unwrap_or((0, 0));
        let (end_line, end_offset) = basis
            .find(CUT_AFTER_STR)
            .map(|offset| {
                let end_line = line_index.line_col(TextSize::from(offset as u32)).line;
                let end_offset = offset as u32; // We'll pick out the trailing newline elsewhere
                (end_line, end_offset)
            })
            .unwrap_or_else(|| {
                let end_offset = basis.len() as u32;
                let end_line = line_index.line_col(TextSize::from(end_offset as u32)).line + 1;
                (end_line, end_offset)
            });
        let substr = basis[start_offset as usize..end_offset as usize].to_string();
        Cut {
            source: substr,
            start_line,
            start_offset,
            end_line,
        }
    }

    fn line_in_cut(&self, line: u32) -> bool {
        line >= self.start_line && line < self.end_line
    }
}

fn ra_hover_to_text(markup: String) -> String {
    markup
        .trim()
        .lines()
        .filter(|&line| line != "```rust" && line != "```")
        .collect::<Vec<_>>()
        .join("\n")
}
