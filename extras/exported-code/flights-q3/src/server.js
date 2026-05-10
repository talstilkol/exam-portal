import express from "express";
import mongoose from "mongoose";
import cors from "cors";
 
const app = express();
app.use(cors());
app.use(express.json());
 
await mongoose.connect("mongodb://127.0.0.1:27017/students_exam");
 
const studentSchema = new mongoose.Schema({
  idNumber: { type: String, required: true, unique: true },
  averageGrade: { type: Number, required: true },
  courseName: { type: String, required: true },
  fullName: { type: String, required: true }
}, { collection: "students" });
 
const Student = mongoose.model("Student", studentSchema);
 
app.get("/students", async (req, res) => {
  res.json(await Student.find());
});
 
app.get("/students/high-average", async (req, res) => {
  res.json(await Student.find({ averageGrade: { $gt: 74 } }));
});
 
app.post("/students", async (req, res) => {
  const { idNumber, averageGrade, courseName, fullName } = req.body;
  if (!idNumber || !courseName || !fullName || !Number.isFinite(Number(averageGrade))) {
    return res.status(400).json({ message: "ERROR: invalid data" });
  }
  const exists = await Student.findOne({ idNumber });
  if (exists) return res.status(409).json({ message: "ERROR: student with this ID exists" });
  const student = await Student.create({ idNumber, averageGrade: Number(averageGrade), courseName, fullName });
  res.status(201).json({ message: "Student accepted successfully", student });
});
 
app.put("/students/:idNumber", async (req, res) => {
  const averageGrade = Number(req.body.averageGrade);
  if (!Number.isFinite(averageGrade)) return res.status(400).json({ message: "ERROR: invalid average" });
  const student = await Student.findOneAndUpdate({ idNumber: req.params.idNumber }, { averageGrade }, { new: true });
  if (!student) return res.status(404).json({ message: "ERROR: student not found" });
  res.json({ message: "Update completed successfully", student });
});
 
app.listen(3000, () => console.log("Students server running on http://localhost:3000"));
