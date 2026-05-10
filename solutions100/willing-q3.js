// Willing — Server Q3 (25 pts)
// "Express + MongoDB — קורסים"
//   GET    /courses           → all courses
//   POST   /courses           → create
//   PUT    /courses/:id       → update
//   DELETE /courses/:id       → remove
//   POST   /courses/filter    → filter by instructor / capacity / has spots

const express = require("express");
const mongoose = require("mongoose");

const PORT      = process.env.PORT      || 3005;
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/willing";

const courseSchema = new mongoose.Schema(
  {
    id:         { type: Number, required: true, unique: true, index: true },
    name:       { type: String, required: true, trim: true },
    instructor: { type: String, required: true, trim: true },
    capacity:   { type: Number, required: true, min: 1, validate: { validator: Number.isInteger, message: "capacity must be integer" } },
    enrolled:   { type: Number, default: 0, min: 0 },
    description:{ type: String, default: "" },
  },
  { timestamps: true }
);
const Course = mongoose.model("Course", courseSchema);

const app = express();
app.use(express.json());

function validateBody(body) {
  const errs = [];
  const { name, instructor, capacity } = body || {};
  if (typeof name !== "string" || !name.trim()) errs.push("name (non-empty string) required");
  if (typeof instructor !== "string" || !instructor.trim()) errs.push("instructor required");
  if (!Number.isInteger(capacity) || capacity <= 0) errs.push("capacity must be a positive integer");
  return errs;
}

// GET /courses
app.get("/courses", async (_req, res) => {
  try {
    const list = await Course.find().lean();
    res.json(list);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /courses — create
app.post("/courses", async (req, res) => {
  const errs = validateBody(req.body);
  if (errs.length > 0) return res.status(400).json({ error: "Invalid body", errors: errs });
  try {
    const id = req.body.id || Date.now();
    const exists = await Course.findOne({ id });
    if (exists) return res.status(409).json({ error: `Course id ${id} already exists` });
    const created = await Course.create({ ...req.body, id });
    res.status(201).json(created);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: "Duplicate id" });
    res.status(500).json({ error: e.message });
  }
});

// PUT /courses/:id — update
app.put("/courses/:id", async (req, res) => {
  try {
    const updated = await Course.findOneAndUpdate(
      { id: Number(req.params.id) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: "Course not found" });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /courses/:id
app.delete("/courses/:id", async (req, res) => {
  try {
    const removed = await Course.findOneAndDelete({ id: Number(req.params.id) });
    if (!removed) return res.status(404).json({ error: "Course not found" });
    res.status(204).end();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /courses/filter — combined filters
app.post("/courses/filter", async (req, res) => {
  const { instructor, minCapacity, hasSpots } = req.body || {};
  const query = {};
  if (typeof instructor === "string" && instructor.trim())
    query.instructor = { $regex: instructor.trim(), $options: "i" };
  if (typeof minCapacity === "number") query.capacity = { $gte: minCapacity };
  try {
    let list = await Course.find(query).lean();
    if (hasSpots) {
      list = list.filter((c) => (c.enrolled || 0) < c.capacity);
    }
    res.json(list);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error", message: err.message });
});

(async () => {
  try {
    await mongoose.connect(MONGO_URL);
    app.listen(PORT, () => console.log(`Willing Q3 on http://localhost:${PORT}`));
  } catch (err) { console.error("Boot failed:", err); process.exit(1); }
})();
