// Travel-SV — Node Q3 (25 pts)
// "חבילת Node — מחלקת קובץ טקסט"
// A class with read/write/append/delete methods using fs/promises (no callbacks).
// Atomic write via temp file + rename. ENOENT handling.

const fs = require("fs/promises");
const path = require("path");
const os = require("os");

class TextFile {
  /**
   * @param {string} filePath — absolute or relative path
   */
  constructor(filePath) {
    if (typeof filePath !== "string" || !filePath) {
      throw new TypeError("filePath must be a non-empty string");
    }
    this.filePath = path.resolve(filePath);
  }

  /**
   * Read full content. Returns '' if file does not exist (ENOENT).
   * @returns {Promise<string>}
   */
  async read() {
    try {
      // ✅ FIXED: async/await (no callbacks)
      return await fs.readFile(this.filePath, "utf-8");
    } catch (err) {
      // ✅ FIXED: ENOENT → return empty string instead of throwing
      if (err.code === "ENOENT") return "";
      throw err;
    }
  }

  /**
   * Returns the file as an array of lines (without trailing empty).
   * @returns {Promise<string[]>}
   */
  async readLines() {
    const content = await this.read();
    if (!content) return [];
    return content.split(/\r?\n/).filter((l) => l.length > 0);
  }

  /**
   * Atomic write: write to temp file in same dir, then rename.
   * If anything fails midway, the original file is untouched.
   * @param {string} content
   */
  async write(content) {
    if (typeof content !== "string") {
      throw new TypeError("content must be a string");
    }
    const dir = path.dirname(this.filePath);
    // Ensure parent dir exists
    await fs.mkdir(dir, { recursive: true });
    const tmpName = `.${path.basename(this.filePath)}.${process.pid}.${Date.now()}.tmp`;
    const tmpPath = path.join(dir, tmpName);
    try {
      // ✅ Atomic write: write to temp, then rename (fs.rename is atomic on same fs)
      await fs.writeFile(tmpPath, content, "utf-8");
      await fs.rename(tmpPath, this.filePath);
    } catch (err) {
      // Cleanup tmp on failure
      try { await fs.unlink(tmpPath); } catch {}
      throw err;
    }
  }

  /**
   * Append content (creates file if missing).
   * @param {string} content
   */
  async append(content) {
    if (typeof content !== "string") {
      throw new TypeError("content must be a string");
    }
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.appendFile(this.filePath, content, "utf-8");
  }

  /**
   * Append a line (auto-adds \n if missing).
   */
  async appendLine(line) {
    const text = line.endsWith("\n") ? line : line + "\n";
    await this.append(text);
  }

  /**
   * Delete the file. ENOENT is treated as success (already gone).
   */
  async delete() {
    try {
      await fs.unlink(this.filePath);
    } catch (err) {
      if (err.code === "ENOENT") return;
      throw err;
    }
  }

  /**
   * Returns true if the file exists and is readable.
   */
  async exists() {
    try {
      await fs.access(this.filePath, fs.constants.F_OK);
      return true;
    } catch { return false; }
  }

  /**
   * File size in bytes (0 if not found).
   */
  async size() {
    try {
      const stat = await fs.stat(this.filePath);
      return stat.size;
    } catch (err) {
      if (err.code === "ENOENT") return 0;
      throw err;
    }
  }
}

// ── Self-test (uncomment to run): ──
// (async () => {
//   const f = new TextFile(path.join(os.tmpdir(), "test.txt"));
//   await f.write("hello\n");
//   await f.appendLine("world");
//   const content = await f.read();
//   console.assert(content === "hello\nworld\n", "content mismatch", content);
//   await f.delete();
// })();

module.exports = { TextFile };
