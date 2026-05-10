import express from "express";
import mongoose from "mongoose";
import cors from "cors";
 
const app = express();
app.use(cors());
app.use(express.json());
 
await mongoose.connect("mongodb://127.0.0.1:27017/games_exam");
 
const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  releaseYear: { type: Number, required: true },
  price: { type: Number, required: true }
});
 
const Game = mongoose.model("Game", gameSchema);
 
app.get("/games", async (req, res) => {
  const games = await Game.find();
  res.json(games);
});
 
app.post("/games", async (req, res) => {
  const { name, description, releaseYear, price } = req.body;
  if (!name || !description || !Number.isFinite(Number(releaseYear)) || !Number.isFinite(Number(price))) {
    return res.status(400).json({ message: "Invalid game data" });
  }
  const game = await Game.create({ name, description, releaseYear: Number(releaseYear), price: Number(price) });
  res.status(201).json(game);
});
 
app.post("/games/filter", async (req, res) => {
  const { year, name, price } = req.body;
  const query = {};
 
  if (year !== undefined && year !== "") query.releaseYear = { $lt: Number(year) };
  if (price !== undefined && price !== "") query.price = { $lt: Number(price) };
  if (name) query.name = { $regex: name, $options: "i" };
 
  const games = await Game.find(query);
  res.json(games);
});
 
app.listen(3000, () => console.log("Games server running on http://localhost:3000"));
