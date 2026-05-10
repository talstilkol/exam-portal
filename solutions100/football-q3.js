// Football Club — Express Q3 (25 pts)
// Computer-game catalog API
//   GET  /          → all games
//   POST /          → add a game (validated)
//   POST /search    → filter by yearMin / nameContains / priceMax (any combo, max 3)
//
// Each game: { name: string, description: string, releaseYear: number, price: number }

const express = require("express");
const fs = require("fs/promises");

const PORT = process.env.PORT || 3001;
const DB_FILE = "./games.json";

// ── persistence helpers ──────────────────────────────────────────────
async function loadGames() {
  try {
    const raw = await fs.readFile(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}
async function saveGames(games) {
  await fs.writeFile(DB_FILE, JSON.stringify(games, null, 2));
}

// ── input validation ────────────────────────────────────────────────
function validateGame(body) {
  const errs = [];
  if (typeof body.name !== "string" || !body.name.trim())
    errs.push("name is required (non-empty string)");
  if (typeof body.description !== "string")
    errs.push("description must be a string");
  if (!Number.isInteger(body.releaseYear) ||
      body.releaseYear < 1950 || body.releaseYear > 2100)
    errs.push("releaseYear must be an integer between 1950 and 2100");
  if (typeof body.price !== "number" || body.price < 0)
    errs.push("price must be a non-negative number");
  return errs;
}

// ── server boot ────────────────────────────────────────────────────
const app = express();
app.use(express.json());

// log every request (helpful when debugging at the exam)
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// in-memory cache; loaded at boot
let games = [];

// GET / — return all games
app.get("/", async (_req, res) => {
  try {
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: "Failed to read games" });
  }
});

// POST / — add a new game
app.post("/", async (req, res) => {
  const errors = validateGame(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Invalid body", errors });
  }
  const game = {
    id: Date.now().toString(36),
    name: req.body.name.trim(),
    description: req.body.description,
    releaseYear: req.body.releaseYear,
    price: req.body.price,
  };
  games.push(game);
  await saveGames(games);
  res.status(201).json(game);
});

// POST /search — filter by any combination of up to 3 fields
//   { yearMin?: number, nameContains?: string, priceMax?: number }
// ✅ FIXED: combined AND filter so all 3 work together (per spec)
app.post("/search", (req, res) => {
  const { yearMin, nameContains, priceMax } = req.body || {};
  const filtered = games.filter((g) => {
    if (typeof yearMin === "number" && g.releaseYear < yearMin) return false;
    if (typeof nameContains === "string" && nameContains &&
        !g.name.toLowerCase().includes(nameContains.toLowerCase())) return false;
    if (typeof priceMax === "number" && g.price > priceMax) return false;
    return true;
  });
  res.json(filtered);
});

// global error middleware
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error", message: err.message });
});

(async () => {
  games = await loadGames();
  app.listen(PORT, () => console.log(`Football Q3 server on http://localhost:${PORT}`));
})();
