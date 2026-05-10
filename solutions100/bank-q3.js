// SV Bank — Server Q3 (15 pts)
// "Express POST /save-text — שמירת טקסט לקובץ"
// Spec: receive text in body, append to file (NOT overwrite), validate input.

const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const PORT = process.env.PORT || 3004;
const TXT_FILE = path.join(__dirname, "saved-text.txt");

const app = express();
app.use(express.json());
app.use((req, _res, next) => { console.log(`${req.method} ${req.url}`); next(); });

// POST /save-text — append text to file
// ✅ FIXED: use fs.appendFile NOT fs.writeFile (writeFile would overwrite previous lines)
app.post("/save-text", async (req, res) => {
  const { text } = req.body || {};
  // ✅ Input validation
  if (typeof text !== "string") {
    return res.status(400).json({ error: "text must be a string" });
  }
  if (!text.trim()) {
    return res.status(400).json({ error: "text cannot be empty" });
  }
  try {
    // Append a single line + newline so each request is its own line
    await fs.appendFile(TXT_FILE, text + "\n", "utf-8");
    res.status(201).json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to write file", message: err.message });
  }
});

// GET /text — read full content (bonus endpoint)
app.get("/text", async (_req, res) => {
  try {
    const content = await fs.readFile(TXT_FILE, "utf-8");
    res.type("text/plain; charset=utf-8").send(content);
  } catch (err) {
    // ✅ FIXED: handle ENOENT — file simply doesn't exist yet
    if (err.code === "ENOENT") {
      return res.type("text/plain").send("");
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /lines — return array of lines (bonus)
app.get("/lines", async (_req, res) => {
  try {
    const content = await fs.readFile(TXT_FILE, "utf-8");
    const lines = content.split("\n").filter((l) => l.length > 0);
    res.json({ count: lines.length, lines });
  } catch (err) {
    if (err.code === "ENOENT") return res.json({ count: 0, lines: [] });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /text — clear file
app.delete("/text", async (_req, res) => {
  try {
    await fs.writeFile(TXT_FILE, "", "utf-8");
    res.json({ ok: true, cleared: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error", message: err.message });
});

app.listen(PORT, () => console.log(`Bank Q3 on http://localhost:${PORT}`));
