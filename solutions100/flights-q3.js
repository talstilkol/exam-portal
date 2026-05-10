// Flights — Server Q3 (25 pts)
// "שרת Express + MongoDB — סטודנטים"
// Endpoints:
//   GET    /students       → all students
//   GET    /students/:id   → single student
//   POST   /students       → create student (id must be unique)
//   PUT    /students/:id   → update existing
//   DELETE /students/:id   → remove
//   POST   /students/filter→ filter by gpa ≥ X / year / name substring

const express = require("express");
const mongoose = require("mongoose");

const PORT      = process.env.PORT      || 3003;
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/flights";

const studentSchema = new mongoose.Schema(
  {
    id:    { type: Number, required: true, unique: true, index: true },
    name:  { type: String, required: true, trim: true },
    age:   { type: Number, required: true, min: 18 },
    gpa:   { type: Number, required: true, min: 0, max: 100 },
    year:  { type: Number, required: true, min: 1, max: 6 },
    email: { type: String, trim: true, lowercase: true },
  },
  { timestamps: true }
);
const Student = mongoose.model("Student", studentSchema);

const app = express();
app.use(express.json());

function validateStudent(body) {
  const errs = [];
  if (typeof body.id !== "number") errs.push("id (number) required");
  if (typeof body.name !== "string" || !body.name.trim()) errs.push("name required");
  if (typeof body.age !== "number" || body.age < 18) errs.push("age must be ≥ 18");
  if (typeof body.gpa !== "number" || body.gpa < 0 || body.gpa > 100) errs.push("gpa must be 0–100");
  if (typeof body.year !== "number" || body.year < 1 || body.year > 6) errs.push("year must be 1–6");
  return errs;
}

// GET /students
app.get("/students", async (_req, res) => {
  try {
    const all = await Student.find().lean();
    res.json(all);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /students/:id
app.get("/students/:id", async (req, res) => {
  try {
    const s = await Student.findOne({ id: Number(req.params.id) }).lean();
    if (!s) return res.status(404).json({ error: "Student not found" });
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /students — create with id duplicate check
app.post("/students", async (req, res) => {
  const errs = validateStudent(req.body);
  if (errs.length > 0) return res.status(400).json({ error: "Invalid body", errors: errs });
  try {
    // ✅ FIXED: id duplicate check before insert
    const exists = await Student.findOne({ id: req.body.id });
    if (exists) return res.status(409).json({ error: `Student with id ${req.body.id} already exists` });
    const created = await Student.create(req.body);
    res.status(201).json(created);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: "Duplicate id" });
    res.status(500).json({ error: e.message });
  }
});

// PUT /students/:id — update existing
app.put("/students/:id", async (req, res) => {
  try {
    const updated = await Student.findOneAndUpdate(
      { id: Number(req.params.id) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: "Student not found" });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /students/:id
app.delete("/students/:id", async (req, res) => {
  try {
    const removed = await Student.findOneAndDelete({ id: Number(req.params.id) });
    if (!removed) return res.status(404).json({ error: "Student not found" });
    res.status(204).end();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /students/filter — combined filters
app.post("/students/filter", async (req, res) => {
  const { minGpa, year, nameContains } = req.body || {};
  const query = {};
  if (typeof minGpa === "number") query.gpa = { $gte: minGpa };
  if (typeof year === "number") query.year = year;
  if (typeof nameContains === "string" && nameContains.trim())
    query.name = { $regex: nameContains.trim(), $options: "i" };
  try {
    const list = await Student.find(query).lean();
    res.json(list);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Error middleware
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error", message: err.message });
});

(async () => {
  try {
    await mongoose.connect(MONGO_URL);
    app.listen(PORT, () => console.log(`Flights Q3 on http://localhost:${PORT}`));
  } catch (err) {
    console.error("Boot failed:", err);
    process.exit(1);
  }
})();
