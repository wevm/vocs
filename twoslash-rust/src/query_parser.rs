use lazy_static::lazy_static;
use regex::Regex;

use ra_ide::{LineCol, LineIndex, TextSize};

use crate::twoslash::QueryKind;

lazy_static! {
    static ref PARSERS: Vec<(QueryKind, Regex, fn(u32) -> u32)> = vec![
        (
            QueryKind::Query,
            Regex::new(r#"^\s*//\s*(?P<caret>\^)\?"#).unwrap(),
            std::convert::identity,
        ),
        (
            QueryKind::Completions,
            Regex::new(r#"^\s*//\s*(?P<caret>\^)\|"#).unwrap(),
            |n| { n - 1 }
        ),
    ];
}

pub struct ParseResult {
    pub code: String,
    pub queries: Vec<(QueryKind, TextSize)>,
}

pub fn find_queries(src: &str) -> ParseResult {
    let mut queries = vec![];
    let mut removed_lines = 0;
    let mut lines = vec![];

    for (i, line) in src.lines().enumerate() {
        let mut skip_line = false;

        // Check for query markers (^? and ^|)
        for (kind, parser, transform_col) in PARSERS.iter() {
            if let Some(capture) = parser.captures(line) {
                let col = capture.name("caret").unwrap().start() as u32;
                let col = transform_col(col);
                queries.push((
                    *kind,
                    LineCol {
                        line: (i - removed_lines - 1) as u32,
                        col,
                    },
                ));
                skip_line = true;
                removed_lines += 1;
            }
        }

        if !skip_line {
            lines.push(line);
        }
    }

    let new_text = lines.join("\n");
    let line_index = LineIndex::new(&new_text);
    let queries = queries
        .into_iter()
        .map(|(kind, line_col)| (kind, line_index.offset(line_col).unwrap()))
        .collect();

    ParseResult {
        code: new_text,
        queries,
    }
}

#[cfg(test)]
mod test {
    use crate::twoslash::QueryKind;

    use super::find_queries;

    #[test]
    fn test_find_queries() {
        let src = r#"
foo.bar()
//   ^?

foo {
    dofoobar
    //  ^?
}

foo.b
//   ^|

foo {
    dofo
    //  ^|
}
"#
        .trim();
        let result = find_queries(src);

        let pretty_queries: Vec<_> = result
            .queries
            .into_iter()
            .map(|(q, pos)| {
                let pos = u32::from(pos) as usize;
                let word = &result.code[pos - 1..pos + 2];
                (q, word)
            })
            .collect();

        let expected = vec![
            (QueryKind::Query, "bar"),
            (QueryKind::Query, "oob"),
            (QueryKind::Completions, ".b\n"),
            (QueryKind::Completions, "fo\n"),
        ];

        assert_eq!(pretty_queries, expected);
    }
}
