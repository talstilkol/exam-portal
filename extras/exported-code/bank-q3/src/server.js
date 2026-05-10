import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
 
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
 
app.post("/save", async (req, res) => {
  const text = (req.body.text || "").trim();
  if (!text) return res.status(400).send("Error: text is required");
  if (text.length > 10) return res.status(400).send("Error: max 10 chars");
  await fs.appendFile("saved.txt", text + "\n", "utf8");
  res.send("Text saved successfully");
});
 
app.listen(3000, () => console.log("Server running at http://localhost:3000"));
 
/* public/index.html
<!doctype html>
<html>
  <body>
    <h1>Save text</h1>
    <form method="POST" action="/save">
      <input name="text" maxlength="10" required />
      <button>Send</button>
    </form>
  </body>
</html>
*/
