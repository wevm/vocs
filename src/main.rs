mod project;
#[cfg(test)]
mod project_test;
mod protocol;
mod query_parser;
mod twoslash;

use project::{Project, ProjectSettings};

use anyhow::Result;
use std::io::{Read, Write};
use std::net::TcpListener;
use tempfile::TempDir;

fn main() -> Result<()> {
    let args: Vec<String> = std::env::args().collect();

    // Parse --cargo-toml argument
    let cargo_toml_content = args
        .iter()
        .position(|arg| arg == "--cargo-toml")
        .and_then(|i| args.get(i + 1))
        .map(|path| std::fs::read_to_string(path))
        .transpose()?;

    // Parse --target-dir argument
    let target_dir = args
        .iter()
        .position(|arg| arg == "--target-dir")
        .and_then(|i| args.get(i + 1).cloned());

    let tmpdir = TempDir::new()?;
    let default_project_name = "twoslash-rust-project";
    let mut project_settings = ProjectSettings {
        project_name: default_project_name,
        tmpdir: &tmpdir,
        cargo_toml: cargo_toml_content.as_deref(),
        target_dir: target_dir.as_deref(),
    };

    if let Ok(server_uuid) = std::env::var("TWOSLASH_SERVER_UUID") {
        let project_name =
            std::env::var("TWOSLASH_PROJECT_NAME").unwrap_or(default_project_name.to_string());
        project_settings.project_name = &project_name;

        // We have been asked to start up in server mode.
        //
        // The server "protocol":
        //
        // 1. <exec> TWOSLASH_SERVER_UUID=00uuid server start.
        // 2. Server writes "<server addr>\n" to stdout.
        // 3. The server is now ready:
        //
        // | client |                            | server @ 0.0.0.0:port |
        //
        //   <code>  --------------------------->
        //           <---------------------------  <json twoslash result>
        //                      ...
        //
        //  "Shutdown 00uuid" ------------------>  <server shutdown>
        //
        let shutdown_message = format!("Shutdown {}", server_uuid);

        // Create the project that we will reuse between connections to the socket.
        let mut project = Project::scaffold(project_settings)?;

        // Start the server side of the socket.
        let server = TcpListener::bind("127.0.0.1:0")?;
        std::io::stdout().write_fmt(format_args!("{}\n", server.local_addr()?))?;
        std::io::stdout().flush()?;

        for stream in server.incoming() {
            std::io::stderr().flush()?;
            let mut stream = stream?;
            let message = protocol::read(&stream)?;

            if message == shutdown_message {
                break;
            }

            // The only other messages we permit via this "protocol" (if you can call it that, lol)
            // are code that should be analyzed for twoslash-ing.
            project = project.apply_change(message);
            let twoslash_result = project.twoslasher()?;

            protocol::write(&stream, &serde_json::to_string(&twoslash_result)?)?;
            stream.flush()?;
        }

        drop(server);
    } else {
        // We are being asked to run in one-off mode.
        let source = {
            let mut buf = String::new();
            std::io::stdin().read_to_string(&mut buf)?;
            buf
        };
        let project = Project::scaffold_with_code(project_settings, &source)?;
        let twoslash_result = project.twoslasher()?;
        println!("{}", serde_json::to_string_pretty(&twoslash_result)?);
    }

    Ok(())
}
