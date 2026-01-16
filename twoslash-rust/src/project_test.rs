#[cfg(test)]
mod tests {
    use crate::project::{Project, ProjectSettings};
    use crate::twoslash::TwoSlash;
    use insta::assert_snapshot;
    use tempfile::TempDir;

    fn twoslash(source: &str) -> TwoSlash {
        let tmpdir = TempDir::new().unwrap();
        let settings = ProjectSettings {
            project_name: "test-project",
            tmpdir: &tmpdir,
            cargo_toml: None,
            target_dir: None,
        };
        let project = Project::scaffold_with_code(settings, source.trim()).unwrap();
        project.twoslasher().unwrap()
    }

    fn snapshot(result: &TwoSlash) -> String {
        serde_json::to_string_pretty(result).unwrap()
    }

    #[test]
    fn test_query_hover_on_variable() {
        let result = twoslash(
            r#"
pub fn example() {
    let x: i32 = 42;
    //  ^?
}
"#,
        );

        assert_eq!(result.queries.len(), 1);
        let query = &result.queries[0];
        assert!(query.text.is_some());
        let text = query.text.as_ref().unwrap();
        assert!(
            text.contains("i32"),
            "Expected hover to contain 'i32', got: {}",
            text
        );

        assert_snapshot!(snapshot(&result), @r#"
        {
          "code": "pub fn example() {\n    let x: i32 = 42;\n}",
          "extension": ".rs",
          "highlights": [],
          "staticQuickInfos": [
            {
              "targetString": "pub fn example() {\n    let x: i32 = 42;\n}",
              "text": "extern crate test_project",
              "start": 0,
              "length": 41,
              "line": 0,
              "character": 0
            },
            {
              "targetString": "example",
              "text": "test_project\n\npub fn example()",
              "start": 7,
              "length": 7,
              "line": 0,
              "character": 7
            },
            {
              "targetString": "x",
              "text": "let x: i32",
              "start": 27,
              "length": 1,
              "line": 1,
              "character": 8
            },
            {
              "targetString": "i32",
              "text": "i32\n\n---\n\nThe 32-bit signed integer type.",
              "start": 30,
              "length": 3,
              "line": 1,
              "character": 11
            }
          ],
          "queries": [
            {
              "kind": "query",
              "line": 2,
              "offset": 8,
              "text": "let x: i32",
              "start": 27,
              "length": 1
            }
          ],
          "tags": [],
          "errors": [
            {
              "renderedMessage": "unused variable",
              "id": "unused_variables",
              "category": "Warning",
              "code": 0,
              "start": 27,
              "length": 1,
              "line": 1,
              "character": 8
            }
          ],
          "playgroundURL": "https://play.rust-lang.org"
        }
        "#);
    }

    #[test]
    fn test_query_hover_on_function() {
        let result = twoslash(
            r#"
fn add(a: i32, b: i32) -> i32 {
    a + b
}

pub fn example() {
    let result = add(1, 2);
    //           ^?
}
"#,
        );

        assert_eq!(result.queries.len(), 1);
        let query = &result.queries[0];
        assert!(query.text.is_some());
        let text = query.text.as_ref().unwrap();
        assert!(
            text.contains("fn add"),
            "Expected hover to contain 'fn add', got: {}",
            text
        );

        assert_snapshot!(snapshot(&result), @r#"
        {
          "code": "fn add(a: i32, b: i32) -> i32 {\n    a + b\n}\n\npub fn example() {\n    let result = add(1, 2);\n}",
          "extension": ".rs",
          "highlights": [],
          "staticQuickInfos": [
            {
              "targetString": "fn add(a: i32, b: i32) -> i32 {\n    a + b\n}\n\npub fn example() {\n    let result = add(1, 2);\n}",
              "text": "extern crate test_project",
              "start": 0,
              "length": 93,
              "line": 0,
              "character": 0
            },
            {
              "targetString": "add",
              "text": "test_project\n\nfn add(a: i32, b: i32) -> i32",
              "start": 3,
              "length": 3,
              "line": 0,
              "character": 3
            },
            {
              "targetString": "add",
              "text": "test_project\n\nfn add(a: i32, b: i32) -> i32",
              "start": 81,
              "length": 3,
              "line": 5,
              "character": 17
            },
            {
              "targetString": "a",
              "text": "a: i32",
              "start": 7,
              "length": 1,
              "line": 0,
              "character": 7
            },
            {
              "targetString": "a",
              "text": "a: i32",
              "start": 36,
              "length": 1,
              "line": 1,
              "character": 4
            },
            {
              "targetString": "i32",
              "text": "i32\n\n---\n\nThe 32-bit signed integer type.",
              "start": 10,
              "length": 3,
              "line": 0,
              "character": 10
            },
            {
              "targetString": "i32",
              "text": "i32\n\n---\n\nThe 32-bit signed integer type.",
              "start": 18,
              "length": 3,
              "line": 0,
              "character": 18
            },
            {
              "targetString": "i32",
              "text": "i32\n\n---\n\nThe 32-bit signed integer type.",
              "start": 26,
              "length": 3,
              "line": 0,
              "character": 26
            },
            {
              "targetString": "b",
              "text": "b: i32",
              "start": 15,
              "length": 1,
              "line": 0,
              "character": 15
            },
            {
              "targetString": "b",
              "text": "b: i32",
              "start": 40,
              "length": 1,
              "line": 1,
              "character": 8
            },
            {
              "targetString": "example",
              "text": "test_project\n\npub fn example()",
              "start": 52,
              "length": 7,
              "line": 4,
              "character": 7
            },
            {
              "targetString": "result",
              "text": "let result: i32",
              "start": 72,
              "length": 6,
              "line": 5,
              "character": 8
            }
          ],
          "queries": [
            {
              "kind": "query",
              "line": 6,
              "offset": 17,
              "text": "test_project\n\nfn add(a: i32, b: i32) -> i32",
              "start": 81,
              "length": 3
            }
          ],
          "tags": [],
          "errors": [
            {
              "renderedMessage": "unused variable",
              "id": "unused_variables",
              "category": "Warning",
              "code": 0,
              "start": 72,
              "length": 6,
              "line": 5,
              "character": 8
            }
          ],
          "playgroundURL": "https://play.rust-lang.org"
        }
        "#);
    }

    #[test]
    fn test_query_hover_on_type() {
        let result = twoslash(
            r#"
pub struct Point {
    x: f64,
    y: f64,
}

pub fn example() {
    let p = Point { x: 1.0, y: 2.0 };
    //  ^?
}
"#,
        );

        assert_eq!(result.queries.len(), 1);
        let query = &result.queries[0];
        assert!(query.text.is_some());
        let text = query.text.as_ref().unwrap();
        assert!(
            text.contains("Point"),
            "Expected hover to contain 'Point', got: {}",
            text
        );

        assert_snapshot!(snapshot(&result), @r#"
        {
          "code": "pub struct Point {\n    x: f64,\n    y: f64,\n}\n\npub fn example() {\n    let p = Point { x: 1.0, y: 2.0 };\n}",
          "extension": ".rs",
          "highlights": [],
          "staticQuickInfos": [
            {
              "targetString": "pub struct Point {\n    x: f64,\n    y: f64,\n}\n\npub fn example() {\n    let p = Point { x: 1.0, y: 2.0 };\n}",
              "text": "extern crate test_project",
              "start": 0,
              "length": 104,
              "line": 0,
              "character": 0
            },
            {
              "targetString": "Point",
              "text": "test_project\n\npub struct Point {\n    x: f64,\n    y: f64,\n}",
              "start": 11,
              "length": 5,
              "line": 0,
              "character": 11
            },
            {
              "targetString": "Point",
              "text": "test_project\n\npub struct Point {\n    x: f64,\n    y: f64,\n}",
              "start": 77,
              "length": 5,
              "line": 6,
              "character": 12
            },
            {
              "targetString": "x",
              "text": "test_project::Point\n\nx: f64",
              "start": 23,
              "length": 1,
              "line": 1,
              "character": 4
            },
            {
              "targetString": "x",
              "text": "test_project::Point\n\nx: f64",
              "start": 85,
              "length": 1,
              "line": 6,
              "character": 20
            },
            {
              "targetString": "f64",
              "text": "f64\n\n---\n\nA 64-bit floating-point type (specifically, the \"binary64\" type defined in IEEE 754-2008).\n\nThis type is very similar to [`prim@f32`](`prim@f32`), but has increased precision by using twice as many\nbits. Please see [the documentation for `f32`](prim@f32) or [Wikipedia on double-precision\nvalues](https://en.wikipedia.org/wiki/Double-precision_floating-point_format) for more information.\n\n*[See also the `std::f64::consts` module](crate::f64::consts).*",
              "start": 26,
              "length": 3,
              "line": 1,
              "character": 7
            },
            {
              "targetString": "f64",
              "text": "f64\n\n---\n\nA 64-bit floating-point type (specifically, the \"binary64\" type defined in IEEE 754-2008).\n\nThis type is very similar to [`prim@f32`](`prim@f32`), but has increased precision by using twice as many\nbits. Please see [the documentation for `f32`](prim@f32) or [Wikipedia on double-precision\nvalues](https://en.wikipedia.org/wiki/Double-precision_floating-point_format) for more information.\n\n*[See also the `std::f64::consts` module](crate::f64::consts).*",
              "start": 38,
              "length": 3,
              "line": 2,
              "character": 7
            },
            {
              "targetString": "y",
              "text": "test_project::Point\n\ny: f64",
              "start": 35,
              "length": 1,
              "line": 2,
              "character": 4
            },
            {
              "targetString": "y",
              "text": "test_project::Point\n\ny: f64",
              "start": 93,
              "length": 1,
              "line": 6,
              "character": 28
            },
            {
              "targetString": "example",
              "text": "test_project\n\npub fn example()",
              "start": 53,
              "length": 7,
              "line": 5,
              "character": 7
            },
            {
              "targetString": "p",
              "text": "let p: Point",
              "start": 73,
              "length": 1,
              "line": 6,
              "character": 8
            }
          ],
          "queries": [
            {
              "kind": "query",
              "line": 7,
              "offset": 8,
              "text": "let p: Point",
              "start": 73,
              "length": 1
            }
          ],
          "tags": [],
          "errors": [
            {
              "renderedMessage": "unused variable",
              "id": "unused_variables",
              "category": "Warning",
              "code": 0,
              "start": 73,
              "length": 1,
              "line": 6,
              "character": 8
            }
          ],
          "playgroundURL": "https://play.rust-lang.org"
        }
        "#);
    }

    #[test]
    fn test_multiple_queries() {
        let result = twoslash(
            r#"
pub fn example() {
    let x: i32 = 1;
    //  ^?
    let y: u64 = 2;
    //  ^?
}
"#,
        );

        assert_eq!(result.queries.len(), 2);

        let first = &result.queries[0];
        assert!(
            first.text.as_ref().unwrap().contains("i32"),
            "Expected i32, got: {}",
            first.text.as_ref().unwrap()
        );

        let second = &result.queries[1];
        assert!(
            second.text.as_ref().unwrap().contains("u64"),
            "Expected u64, got: {}",
            second.text.as_ref().unwrap()
        );

        assert_snapshot!(snapshot(&result), @r#"
        {
          "code": "pub fn example() {\n    let x: i32 = 1;\n    let y: u64 = 2;\n}",
          "extension": ".rs",
          "highlights": [],
          "staticQuickInfos": [
            {
              "targetString": "pub fn example() {\n    let x: i32 = 1;\n    let y: u64 = 2;\n}",
              "text": "extern crate test_project",
              "start": 0,
              "length": 60,
              "line": 0,
              "character": 0
            },
            {
              "targetString": "example",
              "text": "test_project\n\npub fn example()",
              "start": 7,
              "length": 7,
              "line": 0,
              "character": 7
            },
            {
              "targetString": "x",
              "text": "let x: i32",
              "start": 27,
              "length": 1,
              "line": 1,
              "character": 8
            },
            {
              "targetString": "i32",
              "text": "i32\n\n---\n\nThe 32-bit signed integer type.",
              "start": 30,
              "length": 3,
              "line": 1,
              "character": 11
            },
            {
              "targetString": "y",
              "text": "let y: u64",
              "start": 47,
              "length": 1,
              "line": 2,
              "character": 8
            },
            {
              "targetString": "u64",
              "text": "u64\n\n---\n\nThe 64-bit unsigned integer type.",
              "start": 50,
              "length": 3,
              "line": 2,
              "character": 11
            }
          ],
          "queries": [
            {
              "kind": "query",
              "line": 2,
              "offset": 8,
              "text": "let x: i32",
              "start": 27,
              "length": 1
            },
            {
              "kind": "query",
              "line": 3,
              "offset": 8,
              "text": "let y: u64",
              "start": 47,
              "length": 1
            }
          ],
          "tags": [],
          "errors": [
            {
              "renderedMessage": "unused variable",
              "id": "unused_variables",
              "category": "Warning",
              "code": 0,
              "start": 27,
              "length": 1,
              "line": 1,
              "character": 8
            },
            {
              "renderedMessage": "unused variable",
              "id": "unused_variables",
              "category": "Warning",
              "code": 0,
              "start": 47,
              "length": 1,
              "line": 2,
              "character": 8
            }
          ],
          "playgroundURL": "https://play.rust-lang.org"
        }
        "#);
    }

    #[test]
    fn test_query_position_info() {
        let result = twoslash(
            r#"
pub fn example() {
    let foo = 123;
    //  ^?
}
"#,
        );

        assert_eq!(result.queries.len(), 1);
        let query = &result.queries[0];
        assert_eq!(query.line, 2);
        assert!(query.length > 0, "Expected length > 0");

        assert_snapshot!(snapshot(&result), @r#"
        {
          "code": "pub fn example() {\n    let foo = 123;\n}",
          "extension": ".rs",
          "highlights": [],
          "staticQuickInfos": [
            {
              "targetString": "pub fn example() {\n    let foo = 123;\n}",
              "text": "extern crate test_project",
              "start": 0,
              "length": 39,
              "line": 0,
              "character": 0
            },
            {
              "targetString": "example",
              "text": "test_project\n\npub fn example()",
              "start": 7,
              "length": 7,
              "line": 0,
              "character": 7
            },
            {
              "targetString": "foo",
              "text": "let foo: i32",
              "start": 27,
              "length": 3,
              "line": 1,
              "character": 8
            }
          ],
          "queries": [
            {
              "kind": "query",
              "line": 2,
              "offset": 8,
              "text": "let foo: i32",
              "start": 27,
              "length": 3
            }
          ],
          "tags": [],
          "errors": [
            {
              "renderedMessage": "unused variable",
              "id": "unused_variables",
              "category": "Warning",
              "code": 0,
              "start": 27,
              "length": 3,
              "line": 1,
              "character": 8
            }
          ],
          "playgroundURL": "https://play.rust-lang.org"
        }
        "#);
    }

    #[test]
    fn test_static_quick_infos() {
        let result = twoslash(
            r#"
pub fn example() {
    let x: i32 = 42;
}
"#,
        );

        assert!(
            !result.static_quick_infos.is_empty(),
            "Expected some static quick infos"
        );

        assert_snapshot!(snapshot(&result), @r#"
        {
          "code": "pub fn example() {\n    let x: i32 = 42;\n}",
          "extension": ".rs",
          "highlights": [],
          "staticQuickInfos": [
            {
              "targetString": "pub fn example() {\n    let x: i32 = 42;\n}",
              "text": "extern crate test_project",
              "start": 0,
              "length": 41,
              "line": 0,
              "character": 0
            },
            {
              "targetString": "example",
              "text": "test_project\n\npub fn example()",
              "start": 7,
              "length": 7,
              "line": 0,
              "character": 7
            },
            {
              "targetString": "x",
              "text": "let x: i32",
              "start": 27,
              "length": 1,
              "line": 1,
              "character": 8
            },
            {
              "targetString": "i32",
              "text": "i32\n\n---\n\nThe 32-bit signed integer type.",
              "start": 30,
              "length": 3,
              "line": 1,
              "character": 11
            }
          ],
          "queries": [],
          "tags": [],
          "errors": [
            {
              "renderedMessage": "unused variable",
              "id": "unused_variables",
              "category": "Warning",
              "code": 0,
              "start": 27,
              "length": 1,
              "line": 1,
              "character": 8
            }
          ],
          "playgroundURL": "https://play.rust-lang.org"
        }
        "#);
    }

    #[test]
    fn test_completions_query() {
        let result = twoslash(
            r#"
pub struct Foo {
    pub bar: i32,
    pub baz: i32,
}

pub fn example() {
    let f = Foo { bar: 1, baz: 2 };
    f.bar
//      ^|
}
"#,
        );

        assert_eq!(result.queries.len(), 1);
        let query = &result.queries[0];
        assert!(query.completions.is_some(), "Expected completions");
        let completions = query.completions.as_ref().unwrap();
        assert!(!completions.is_empty(), "Expected at least one completion");

        let names: Vec<&str> = completions.iter().map(|c| c.name.as_str()).collect();
        assert!(
            names.contains(&"bar"),
            "Expected 'bar' in completions, got: {:?}",
            names
        );
        assert!(
            names.contains(&"baz"),
            "Expected 'baz' in completions, got: {:?}",
            names
        );

        assert_snapshot!(snapshot(&result), @r#"
        {
          "code": "pub struct Foo {\n    pub bar: i32,\n    pub baz: i32,\n}\n\npub fn example() {\n    let f = Foo { bar: 1, baz: 2 };\n    f.bar\n}",
          "extension": ".rs",
          "highlights": [],
          "staticQuickInfos": [
            {
              "targetString": "pub struct Foo {\n    pub bar: i32,\n    pub baz: i32,\n}\n\npub fn example() {\n    let f = Foo { bar: 1, baz: 2 };\n    f.bar\n}",
              "text": "extern crate test_project",
              "start": 0,
              "length": 122,
              "line": 0,
              "character": 0
            },
            {
              "targetString": "Foo",
              "text": "test_project\n\npub struct Foo {\n    pub bar: i32,\n    pub baz: i32,\n}",
              "start": 11,
              "length": 3,
              "line": 0,
              "character": 11
            },
            {
              "targetString": "Foo",
              "text": "test_project\n\npub struct Foo {\n    pub bar: i32,\n    pub baz: i32,\n}",
              "start": 87,
              "length": 3,
              "line": 6,
              "character": 12
            },
            {
              "targetString": "bar",
              "text": "test_project::Foo\n\npub bar: i32",
              "start": 25,
              "length": 3,
              "line": 1,
              "character": 8
            },
            {
              "targetString": "bar",
              "text": "test_project::Foo\n\npub bar: i32",
              "start": 93,
              "length": 3,
              "line": 6,
              "character": 18
            },
            {
              "targetString": "bar",
              "text": "test_project::Foo\n\npub bar: i32",
              "start": 117,
              "length": 3,
              "line": 7,
              "character": 6
            },
            {
              "targetString": "i32",
              "text": "i32\n\n---\n\nThe 32-bit signed integer type.",
              "start": 30,
              "length": 3,
              "line": 1,
              "character": 13
            },
            {
              "targetString": "i32",
              "text": "i32\n\n---\n\nThe 32-bit signed integer type.",
              "start": 48,
              "length": 3,
              "line": 2,
              "character": 13
            },
            {
              "targetString": "baz",
              "text": "test_project::Foo\n\npub baz: i32",
              "start": 43,
              "length": 3,
              "line": 2,
              "character": 8
            },
            {
              "targetString": "baz",
              "text": "test_project::Foo\n\npub baz: i32",
              "start": 101,
              "length": 3,
              "line": 6,
              "character": 26
            },
            {
              "targetString": "example",
              "text": "test_project\n\npub fn example()",
              "start": 63,
              "length": 7,
              "line": 5,
              "character": 7
            },
            {
              "targetString": "f",
              "text": "let f: Foo",
              "start": 83,
              "length": 1,
              "line": 6,
              "character": 8
            },
            {
              "targetString": "f",
              "text": "let f: Foo",
              "start": 115,
              "length": 1,
              "line": 7,
              "character": 4
            }
          ],
          "queries": [
            {
              "kind": "query",
              "line": 7,
              "offset": 6,
              "start": 117,
              "length": 3,
              "completions": [
                {
                  "name": "bar"
                },
                {
                  "name": "baz"
                },
                {
                  "name": "try_into"
                },
                {
                  "name": "into"
                },
                {
                  "name": "ref"
                },
                {
                  "name": "refm"
                },
                {
                  "name": "deref"
                },
                {
                  "name": "box"
                },
                {
                  "name": "dbg"
                },
                {
                  "name": "dbgr"
                },
                {
                  "name": "call"
                },
                {
                  "name": "let"
                },
                {
                  "name": "letm"
                },
                {
                  "name": "match"
                },
                {
                  "name": "unsafe"
                },
                {
                  "name": "const"
                },
                {
                  "name": "return"
                }
              ],
              "completionsPrefix": "bar"
            }
          ],
          "tags": [],
          "errors": [
            {
              "renderedMessage": "expected (), found i32",
              "id": "E0308",
              "category": "Error",
              "code": 0,
              "start": 117,
              "length": 3,
              "line": 7,
              "character": 6
            }
          ],
          "playgroundURL": "https://play.rust-lang.org"
        }
        "#);
    }

    #[test]
    fn test_completions_on_method() {
        let result = twoslash(
            r#"
pub struct Counter {
    value: i32,
}

impl Counter {
    pub fn increment(&mut self) {
        self.value += 1;
    }
    pub fn get(&self) -> i32 {
        self.value
    }
}

pub fn example() {
    let mut c = Counter { value: 0 };
    c.get
//      ^|
}
"#,
        );

        assert_eq!(result.queries.len(), 1);
        let query = &result.queries[0];
        assert!(query.completions.is_some(), "Expected completions");
        let completions = query.completions.as_ref().unwrap();

        let names: Vec<&str> = completions.iter().map(|c| c.name.as_str()).collect();
        assert!(
            names.contains(&"get"),
            "Expected 'get' in completions, got: {:?}",
            names
        );
        assert!(
            names.contains(&"increment"),
            "Expected 'increment' in completions, got: {:?}",
            names
        );
        assert!(
            names.contains(&"value"),
            "Expected 'value' (field) in completions, got: {:?}",
            names
        );

        assert_snapshot!(snapshot(&result), @r#"
        {
          "code": "pub struct Counter {\n    value: i32,\n}\n\nimpl Counter {\n    pub fn increment(&mut self) {\n        self.value += 1;\n    }\n    pub fn get(&self) -> i32 {\n        self.value\n    }\n}\n\npub fn example() {\n    let mut c = Counter { value: 0 };\n    c.get\n}",
          "extension": ".rs",
          "highlights": [],
          "staticQuickInfos": [
            {
              "targetString": "pub struct Counter {\n    value: i32,\n}\n\nimpl Counter {\n    pub fn increment(&mut self) {\n        self.value += 1;\n    }\n    pub fn get(&self) -> i32 {\n        self.value\n    }\n}\n\npub fn example() {\n    let mut c = Counter { value: 0 };\n    c.get\n}",
              "text": "extern crate test_project",
              "start": 0,
              "length": 247,
              "line": 0,
              "character": 0
            },
            {
              "targetString": "Counter",
              "text": "test_project\n\npub struct Counter {\n    value: i32,\n}",
              "start": 11,
              "length": 7,
              "line": 0,
              "character": 11
            },
            {
              "targetString": "Counter",
              "text": "test_project\n\npub struct Counter {\n    value: i32,\n}",
              "start": 45,
              "length": 7,
              "line": 4,
              "character": 5
            },
            {
              "targetString": "Counter",
              "text": "test_project\n\npub struct Counter {\n    value: i32,\n}",
              "start": 214,
              "length": 7,
              "line": 14,
              "character": 16
            },
            {
              "targetString": "value",
              "text": "test_project::Counter\n\nvalue: i32",
              "start": 25,
              "length": 5,
              "line": 1,
              "character": 4
            },
            {
              "targetString": "value",
              "text": "test_project::Counter\n\nvalue: i32",
              "start": 102,
              "length": 5,
              "line": 6,
              "character": 13
            },
            {
              "targetString": "value",
              "text": "test_project::Counter\n\nvalue: i32",
              "start": 164,
              "length": 5,
              "line": 9,
              "character": 13
            },
            {
              "targetString": "value",
              "text": "test_project::Counter\n\nvalue: i32",
              "start": 224,
              "length": 5,
              "line": 14,
              "character": 26
            },
            {
              "targetString": "i32",
              "text": "i32\n\n---\n\nThe 32-bit signed integer type.",
              "start": 32,
              "length": 3,
              "line": 1,
              "character": 11
            },
            {
              "targetString": "i32",
              "text": "i32\n\n---\n\nThe 32-bit signed integer type.",
              "start": 145,
              "length": 3,
              "line": 8,
              "character": 25
            },
            {
              "targetString": "increment",
              "text": "test_project::Counter\n\npub fn increment(&mut self)",
              "start": 66,
              "length": 9,
              "line": 5,
              "character": 11
            },
            {
              "targetString": "self",
              "text": "self: &mut Counter",
              "start": 81,
              "length": 4,
              "line": 5,
              "character": 26
            },
            {
              "targetString": "self",
              "text": "self: &mut Counter",
              "start": 97,
              "length": 4,
              "line": 6,
              "character": 8
            },
            {
              "targetString": "get",
              "text": "test_project::Counter\n\npub fn get(&self) -> i32",
              "start": 131,
              "length": 3,
              "line": 8,
              "character": 11
            },
            {
              "targetString": "get",
              "text": "test_project::Counter\n\npub fn get(&self) -> i32",
              "start": 242,
              "length": 3,
              "line": 15,
              "character": 6
            },
            {
              "targetString": "self",
              "text": "self: &Counter",
              "start": 136,
              "length": 4,
              "line": 8,
              "character": 16
            },
            {
              "targetString": "self",
              "text": "self: &Counter",
              "start": 159,
              "length": 4,
              "line": 9,
              "character": 8
            },
            {
              "targetString": "example",
              "text": "test_project\n\npub fn example()",
              "start": 186,
              "length": 7,
              "line": 13,
              "character": 7
            },
            {
              "targetString": "c",
              "text": "let mut c: Counter",
              "start": 210,
              "length": 1,
              "line": 14,
              "character": 12
            },
            {
              "targetString": "c",
              "text": "let mut c: Counter",
              "start": 240,
              "length": 1,
              "line": 15,
              "character": 4
            }
          ],
          "queries": [
            {
              "kind": "query",
              "line": 15,
              "offset": 6,
              "start": 242,
              "length": 3,
              "completions": [
                {
                  "name": "value"
                },
                {
                  "name": "try_into"
                },
                {
                  "name": "into"
                },
                {
                  "name": "get"
                },
                {
                  "name": "increment"
                },
                {
                  "name": "ref"
                },
                {
                  "name": "refm"
                },
                {
                  "name": "deref"
                },
                {
                  "name": "box"
                },
                {
                  "name": "dbg"
                },
                {
                  "name": "dbgr"
                },
                {
                  "name": "call"
                },
                {
                  "name": "let"
                },
                {
                  "name": "letm"
                },
                {
                  "name": "match"
                },
                {
                  "name": "unsafe"
                },
                {
                  "name": "const"
                },
                {
                  "name": "return"
                }
              ],
              "completionsPrefix": "get"
            }
          ],
          "tags": [],
          "errors": [
            {
              "renderedMessage": "no field `get` on type `Counter`, but a method with a similar name exists",
              "id": "E0559",
              "category": "Error",
              "code": 0,
              "start": 242,
              "length": 3,
              "line": 15,
              "character": 6
            },
            {
              "renderedMessage": "expected (), found i32",
              "id": "E0308",
              "category": "Error",
              "code": 0,
              "start": 242,
              "length": 3,
              "line": 15,
              "character": 6
            }
          ],
          "playgroundURL": "https://play.rust-lang.org"
        }
        "#);
    }

    #[test]
    fn test_no_errors_suppresses_diagnostics() {
        let result = twoslash(
            r#"
// @noErrors
fn main() {
    let x = 42;
    let message = "Hello, Rust!";
}
"#,
        );

        assert!(
            result.errors.is_empty(),
            "Expected no errors with @noErrors, got: {:?}",
            result
                .errors
                .iter()
                .map(|e| &e.rendered_message)
                .collect::<Vec<_>>()
        );

        assert_snapshot!(snapshot(&result), @r#"
        {
          "code": "fn main() {\n    let x = 42;\n    let message = \"Hello, Rust!\";\n}",
          "extension": ".rs",
          "highlights": [],
          "staticQuickInfos": [
            {
              "targetString": "fn main() {\n    let x = 42;\n    let message = \"Hello, Rust!\";\n}",
              "text": "extern crate test_project",
              "start": 0,
              "length": 63,
              "line": 0,
              "character": 0
            },
            {
              "targetString": "main",
              "text": "test_project\n\nfn main()",
              "start": 3,
              "length": 4,
              "line": 0,
              "character": 3
            },
            {
              "targetString": "x",
              "text": "let x: i32",
              "start": 20,
              "length": 1,
              "line": 1,
              "character": 8
            },
            {
              "targetString": "message",
              "text": "let message: &'static str",
              "start": 36,
              "length": 7,
              "line": 2,
              "character": 8
            }
          ],
          "queries": [],
          "tags": [],
          "errors": [],
          "playgroundURL": "https://play.rust-lang.org"
        }
        "#);
    }

    #[test]
    fn test_cut_removes_imports_but_keeps_types() {
        let result = twoslash(
            r#"
pub struct Config {
    pub name: String,
    pub value: i32,
}
// ---cut---
pub fn example() {
    let cfg = Config { name: String::new(), value: 42 };
    //  ^?
}
"#,
        );

        assert!(
            !result.code.contains("pub struct Config"),
            "Expected struct definition to be cut from output, got: {}",
            result.code
        );

        assert_eq!(result.queries.len(), 1);
        let query = &result.queries[0];
        assert!(query.text.is_some(), "Expected hover text");
        let text = query.text.as_ref().unwrap();
        assert!(
            text.contains("Config"),
            "Expected hover to contain 'Config', got: {}",
            text
        );

        assert_snapshot!(snapshot(&result), @r#"
        {
          "code": "pub fn example() {\n    let cfg = Config { name: String::new(), value: 42 };\n}",
          "extension": ".rs",
          "highlights": [],
          "staticQuickInfos": [
            {
              "targetString": "Config",
              "text": "test_project\n\npub struct Config {\n    pub name: String,\n    pub value: i32,\n}",
              "start": 33,
              "length": 6,
              "line": 1,
              "character": 14
            },
            {
              "targetString": "name",
              "text": "test_project::Config\n\npub name: String",
              "start": 42,
              "length": 4,
              "line": 1,
              "character": 23
            },
            {
              "targetString": "String",
              "text": "alloc::string\n\npub struct String {\n    vec: Vec<u8>,\n}\n\n---\n\nA UTF-8–encoded, growable string.\n\n`String` is the most common string type. It has ownership over the contents\nof the string, stored in a heap-allocated buffer (see [Representation](https://doc.rust-lang.org/stable/alloc/string/struct.String.html#representation)).\nIt is closely related to its borrowed counterpart, the primitive [`str`].\n\n# Examples\n\nYou can create a `String` from [a literal string](https://doc.rust-lang.org/stable/alloc/str/index.html) with [`String::from`]:\n\nlet hello = String::from(\"Hello, world!\");\n\nYou can append a [`char`](https://doc.rust-lang.org/nightly/core/primitive.char.html) to a `String` with the [`push`] method, and\nappend a [`&str`] with the [`push_str`] method:\n\nlet mut hello = String::from(\"Hello, \");\n\nhello.push('w');\nhello.push_str(\"orld!\");\n\nIf you have a vector of UTF-8 bytes, you can create a `String` from it with\nthe [`from_utf8`] method:\n\n// some bytes, in a vector\nlet sparkle_heart = vec![240, 159, 146, 150];\n\n// We know these bytes are valid, so we'll use `unwrap()`.\nlet sparkle_heart = String::from_utf8(sparkle_heart).unwrap();\n\nassert_eq!(\"💖\", sparkle_heart);\n\n# UTF-8\n\n`String`s are always valid UTF-8. If you need a non-UTF-8 string, consider\n[`OsString`](https://doc.rust-lang.org/stable/std/ffi/struct.OsString.html). It is similar, but without the UTF-8 constraint. Because UTF-8\nis a variable width encoding, `String`s are typically smaller than an array of\nthe same `char`s:\n\n// `s` is ASCII which represents each `char` as one byte\nlet s = \"hello\";\nassert_eq!(s.len(), 5);\n\n// A `char` array with the same contents would be longer because\n// every `char` is four bytes\nlet s = ['h', 'e', 'l', 'l', 'o'];\nlet size: usize = s.into_iter().map(|c| size_of_val(&c)).sum();\nassert_eq!(size, 20);\n\n// However, for non-ASCII strings, the difference will be smaller\n// and sometimes they are the same\nlet s = \"💖💖💖💖💖\";\nassert_eq!(s.len(), 20);\n\nlet s = ['💖', '💖', '💖', '💖', '💖'];\nlet size: usize = s.into_iter().map(|c| size_of_val(&c)).sum();\nassert_eq!(size, 20);\n\nThis raises interesting questions as to how `s[i]` should work.\nWhat should `i` be here? Several options include byte indices and\n`char` indices but, because of UTF-8 encoding, only byte indices\nwould provide constant time indexing. Getting the `i`th `char`, for\nexample, is available using [`chars`]:\n\nlet s = \"hello\";\nlet third_character = s.chars().nth(2);\nassert_eq!(third_character, Some('l'));\n\nlet s = \"💖💖💖💖💖\";\nlet third_character = s.chars().nth(2);\nassert_eq!(third_character, Some('💖'));\n\nNext, what should `s[i]` return? Because indexing returns a reference\nto underlying data it could be `&u8`, `&[u8]`, or something similar.\nSince we're only providing one index, `&u8` makes the most sense but that\nmight not be what the user expects and can be explicitly achieved with\n[`as_bytes()`]:\n\n// The first byte is 104 - the byte value of `'h'`\nlet s = \"hello\";\nassert_eq!(s.as_bytes()[0], 104);\n// or\nassert_eq!(s.as_bytes()[0], b'h');\n\n// The first byte is 240 which isn't obviously useful\nlet s = \"💖💖💖💖💖\";\nassert_eq!(s.as_bytes()[0], 240);\n\nDue to these ambiguities/restrictions, indexing with a `usize` is simply\nforbidden:\n\n```compile_fail,E0277\nlet s = \"hello\";\n\n// The following will not compile!\nprintln!(\"The first letter of s is {}\", s[0]);\n\nIt is more clear, however, how `&s[i..j]` should work (that is,\nindexing with a range). It should accept byte indices (to be constant-time)\nand return a `&str` which is UTF-8 encoded. This is also called \"string slicing\".\nNote this will panic if the byte indices provided are not character\nboundaries - see [`is_char_boundary`] for more details. See the implementations\nfor [`SliceIndex<str>`] for more details on string slicing. For a non-panicking\nversion of string slicing, see [`get`].\n\nThe [`bytes`] and [`chars`] methods return iterators over the bytes and\ncodepoints of the string, respectively. To iterate over codepoints along\nwith byte indices, use [`char_indices`].\n\n# Deref\n\n`String` implements <code>\n[Deref]\\<Target = [str]\\></code>, and so inherits all of [`str`]'s\nmethods. In addition, this means that you can pass a `String` to a\nfunction which takes a [`&str`] by using an ampersand (`&`):\n\nfn takes_str(s: &str) { }\n\nlet s = String::from(\"Hello\");\n\ntakes_str(&s);\n\nThis will create a [`&str`] from the `String` and pass it in. This\nconversion is very inexpensive, and so generally, functions will accept\n[`&str`]s as arguments unless they need a `String` for some specific\nreason.\n\nIn certain cases Rust doesn't have enough information to make this\nconversion, known as [`Deref`] coercion. In the following example a string\nslice [`&'a str`](https://doc.rust-lang.org/stable/alloc/str/index.html) implements the trait `TraitExample`, and the function\n`example_func` takes anything that implements the trait. In this case Rust\nwould need to make two implicit conversions, which Rust doesn't have the\nmeans to do. For that reason, the following example will not compile.\n\n```compile_fail,E0277\ntrait TraitExample {}\n\nimpl<'a> TraitExample for &'a str {}\n\nfn example_func<A: TraitExample>(example_arg: A) {}\n\nlet example_string = String::from(\"example_string\");\nexample_func(&example_string);\n\nThere are two options that would work instead. The first would be to\nchange the line `example_func(&example_string);` to\n`example_func(example_string.as_str());`, using the method [`as_str()`]\nto explicitly extract the string slice containing the string. The second\nway changes `example_func(&example_string);` to\n`example_func(&*example_string);`. In this case we are dereferencing a\n`String` to a [`str`], then referencing the [`str`] back to\n[`&str`]. The second way is more idiomatic, however both work to do the\nconversion explicitly rather than relying on the implicit conversion.\n\n# Representation\n\nA `String` is made up of three components: a pointer to some bytes, a\nlength, and a capacity. The pointer points to the internal buffer which `String`\nuses to store its data. The length is the number of bytes currently stored\nin the buffer, and the capacity is the size of the buffer in bytes. As such,\nthe length will always be less than or equal to the capacity.\n\nThis buffer is always stored on the heap.\n\nYou can look at these with the [`as_ptr`], [`len`], and [`capacity`]\nmethods:\n\nuse std::mem;\n\nlet story = String::from(\"Once upon a time...\");\n\n// Prevent automatically dropping the String's data\nlet mut story = mem::ManuallyDrop::new(story);\n\nlet ptr = story.as_mut_ptr();\nlet len = story.len();\nlet capacity = story.capacity();\n\n// story has nineteen bytes\nassert_eq!(19, len);\n\n// We can re-build a String out of ptr, len, and capacity. This is all\n// unsafe because we are responsible for making sure the components are\n// valid:\nlet s = unsafe { String::from_raw_parts(ptr, len, capacity) } ;\n\nassert_eq!(String::from(\"Once upon a time...\"), s);\n\nIf a `String` has enough capacity, adding elements to it will not\nre-allocate. For example, consider this program:\n\nlet mut s = String::new();\n\nprintln!(\"{}\", s.capacity());\n\nfor _ in 0..5 {\n    s.push_str(\"hello\");\n    println!(\"{}\", s.capacity());\n}\n\nThis will output the following:\n\n```text\n0\n8\n16\n16\n32\n32\n\nAt first, we have no memory allocated at all, but as we append to the\nstring, it increases its capacity appropriately. If we instead use the\n[`with_capacity`] method to allocate the correct capacity initially:\n\nlet mut s = String::with_capacity(25);\n\nprintln!(\"{}\", s.capacity());\n\nfor _ in 0..5 {\n    s.push_str(\"hello\");\n    println!(\"{}\", s.capacity());\n}\n\nWe end up with a different output:\n\n```text\n25\n25\n25\n25\n25\n25\n\nHere, there's no need to allocate more memory inside the loop.",
              "start": 48,
              "length": 6,
              "line": 1,
              "character": 29
            },
            {
              "targetString": "value",
              "text": "test_project::Config\n\npub value: i32",
              "start": 63,
              "length": 5,
              "line": 1,
              "character": 44
            },
            {
              "targetString": "example",
              "text": "test_project\n\npub fn example()",
              "start": 7,
              "length": 7,
              "line": 0,
              "character": 7
            },
            {
              "targetString": "cfg",
              "text": "let cfg: Config",
              "start": 27,
              "length": 3,
              "line": 1,
              "character": 8
            },
            {
              "targetString": "new",
              "text": "alloc::string::String\n\npub const fn new() -> String\n\n---\n\nCreates a new empty `String`.\n\nGiven that the `String` is empty, this will not allocate any initial\nbuffer. While that means that this initial operation is very\ninexpensive, it may cause excessive allocation later when you add\ndata. If you have an idea of how much data the `String` will hold,\nconsider the [`with_capacity`] method to prevent excessive\nre-allocation.\n\n# Examples\n\nlet s = String::new();",
              "start": 56,
              "length": 3,
              "line": 1,
              "character": 37
            }
          ],
          "queries": [
            {
              "kind": "query",
              "line": 2,
              "offset": 8,
              "text": "let cfg: Config",
              "start": 27,
              "length": 3
            }
          ],
          "tags": [],
          "errors": [
            {
              "renderedMessage": "unused variable",
              "id": "unused_variables",
              "category": "Warning",
              "code": 0,
              "start": 27,
              "length": 3,
              "line": 1,
              "character": 8
            }
          ],
          "playgroundURL": "https://play.rust-lang.org"
        }
        "#);
    }
}
