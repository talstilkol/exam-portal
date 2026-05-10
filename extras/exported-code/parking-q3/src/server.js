import express from "express";
import mongoose from "mongoose";
import cors from "cors";
 
const app = express();
app.use(cors());
app.use(express.json());
 
await mongoose.connect("mongodb://127.0.0.1:27017/teachers_exam");
 
const teacherSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  idNumber: { type: String, required: true },
  salary: { type: Number, required: true },
  subject: { type: String, required: true }
});
 
const Teacher = mongoose.model("Teacher", teacherSchema);
 
app.get("/teachers", async (req, res) => {
  res.json(await Teacher.find());
});
 
app.post("/teachers/by-salary", async (req, res) => {
  const salary = Number(req.body.salary);
  if (!Number.isFinite(salary)) return res.status(400).json({ message: "salary must be number" });
  const teachers = await Teacher.find({ salary: { $lt: salary } });
  res.json(teachers);
});
 
app.post("/teachers", async (req, res) => {
  const { fullName, idNumber, salary, subject } = req.body;
  if (!fullName || !idNumber || !subject || !Number.isFinite(Number(salary))) {
    return res.status(400).json({ message: "missing or invalid teacher data" });
  }
 
  const exists = await Teacher.findOne({ fullName, subject });
  if (exists) return res.status(409).json({ message: "Teacher with same name and subject already exists" });
 
  const teacher = await Teacher.create({ fullName, idNumber, salary: Number(salary), subject });
  res.status(201).json({ message: "Teacher registered successfully", teacher });
});
 
app.listen(3000, () => console.log("Teachers server running on http://localhost:3000"));
