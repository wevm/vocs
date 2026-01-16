use std::io::{Read, Write};

use anyhow::Result;

pub fn read(mut reader: impl Read) -> Result<String> {
    let mut msg_size_buf = [0; 4];
    reader.read_exact(&mut msg_size_buf)?;
    let msg_size = u32::from_be_bytes(msg_size_buf);

    let mut msg_buf = vec![0; msg_size as usize];
    reader.read_exact(&mut msg_buf)?;

    // protocol demands that the message be valid UTF-8
    let result = String::from_utf8(msg_buf)?;
    Ok(result)
}

pub fn write(mut writer: impl Write, msg: &str) -> Result<()> {
    let msg_size = msg.len();
    let msg_size_buf = u32::to_be_bytes(msg_size as u32);
    let mut msg_buf = Vec::new();
    msg_buf.extend_from_slice(&msg_size_buf);
    msg_buf.extend_from_slice(msg.as_bytes());

    writer.write_all(&msg_buf)?;
    Ok(())
}
