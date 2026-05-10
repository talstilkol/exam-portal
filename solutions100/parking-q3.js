// SV Parking — Server Q3 (25 pts)
// "שרת Express + MongoDB — מורים"
// Endpoints (per spec):
//   GET  /teachers           → all teachers
//   POST /low-salary         → teachers with salary < req.body.minSalary
//   POST /add-or-update      → if teacher.id exists → update; else create (upsert)

const express = require("express");
const mongoose = require("mongoose");

const PORT     = process.env.PORT     || 3002;
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/svparking";

// ── Mongoose schema ──────────────────────────────────────────────
const teacherSchema = new mongoose.Schema(
  {
    id:        { type: Number, required: true, unique: true, index: true },
    name:      { type: String, required: true, trim: true },
    salary:    { type: Number, required: true, min: 0 },
    subject:   { type: String, default: "" },
    seniority: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);
const Teacher = mongoose.model("Teacher", teacherSchema);

// ── App ──────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use((req, _res, next) => { console.log(`${req.method} ${req.url}`); next(); });

// GET /teachers — return all
app.get("/teachers", async (_req, res) => {
  try {
    const all = await Teacher.find().lean();
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch teachers", message: err.message });
  }
});

// POST /low-salary — return teachers with salary < req.body.minSalary
// ✅ FIXED: spec says "less than" (לפי שכר נמוך מהערך המוזן ע"י המשתמש)
app.post("/low-salary", async (req, res) => {
  const { minSalary } = req.body || {};
  if (typeof minSalary !== "number" || !Number.isFinite(minSalary)) {
    return res.status(400).json({ error: "minSalary must be a finite number" });
  }
  try {
    const list = await Teacher.find({ salary: { $lt: minSalary } }).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Query failed", message: err.message });
  }
});

// POST /add-or-update — upsert by id
// ✅ FIXED: spec — if id exists, update existing (don't create new)
app.post("/add-or-update", async (req, res) => {
  const { id, name, salary, subject, seniority } = req.body || {};
  if (typeof id !== "number" || typeof name !== "string" ||
      typeof salary !== "number" || salary < 0) {
    return res.status(400).json({
      error: "Invalid body",
      details: "id (number), name (string), salary (number ≥ 0) required",
    });
  }
  try {
    const result = await Teacher.findOneAndUpdate(
      { id },
      { id, name: name.trim(), salary, subject, seniority },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // Determine if it was created or updated for response status
    const existedBefore = result.createdAt && result.updatedAt &&
      result.createdAt.getTime() !== result.updatedAt.getTime();
    res.status(existedBefore ? 200 : 201).json(result);
  } catch (err) {
    res.status(500).json({ error: "Upsert failed", message: err.message });
  }
});

// Global error middleware
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error", message: err.message });
});

// ── Boot with proper error handling ──────────────────────────────
async function start() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Parking Q3 server on http://localhost:${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
