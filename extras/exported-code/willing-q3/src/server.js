import express from "express";
import mongoose from "mongoose";
 
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
 
await mongoose.connect("mongodb://127.0.0.1:27017/courses_exam");
 
const courseSchema = new mongoose.Schema({
  courseName: { type: String, required: true, unique: true },
  studentsCount: { type: Number, required: true },
  startYear: { type: Number, required: true }
});
const Course = mongoose.model("Course", courseSchema);
 
app.get("/addnewcourse", (req, res) => {
  res.send(`<!doctype html><html><body>
    <form method="POST" action="/add">
      <input name="courseName" maxlength="15" placeholder="Course name" required />
      <input name="studentsCount" type="number" min="1" max="20" placeholder="Students" required />
      <input name="startYear" pattern="\\d{4}" placeholder="Start year" required />
      <button>Create</button>
    </form>
    <button onclick="fetch('/all').then(r=>r.json()).then(data=>document.body.innerHTML += '<pre>'+JSON.stringify(data,null,2)+'</pre>')">Show all courses</button>
  </body></html>`);
});
 
app.post("/add", async (req, res) => {
  const { courseName, studentsCount, startYear } = req.body;
  if (!/^[A-Za-z]{1,15}$/.test(courseName)) return res.status(400).send("Invalid course name");
  if (!Number.isInteger(Number(studentsCount)) || Number(studentsCount) > 20) return res.status(400).send("Invalid students count");
  if (!/^\d{4}$/.test(String(startYear))) return res.status(400).send("Invalid year");
  const exists = await Course.findOne({ courseName });
  if (exists) return res.status(409).send("Course already exists");
  await Course.create({ courseName, studentsCount: Number(studentsCount), startYear: Number(startYear) });
  res.status(201).send("Course added successfully");
});
 
app.get("/all", async (req, res) => {
  const courses = await Course.find().sort({ courseName: 1 });
  res.json(courses);
});
 
app.listen(3000, () => console.log("Courses server running on http://localhost:3000"));
