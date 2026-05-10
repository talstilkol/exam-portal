const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

let rates = [
  { type: "USD", value: 3.5 },
  { type: "EUR", value: 3.8 },
  { type: "GBP", value: 4.3 }
];

// GET /rates — all rates
app.get("/rates", (req, res) => {
  res.json(rates);
});

// POST /rates — add new rate
app.post("/rates", (req, res) => {
  const { type, value } = req.body;
  if (!type || !/^[A-Za-z]+$/.test(type)) {
    return res.status(400).json({ error: "type must be English letters only" });
  }
  if (typeof value !== "number" || value <= 0) {
    return res.status(400).json({ error: "value must be a positive number" });
  }
  const rate = { type: type.toUpperCase(), value };
  rates.push(rate);
  res.status(201).json(rate);
});

// PUT /rates/:type — update value by type
app.put("/rates/:type", (req, res) => {
  const rate = rates.find(r => r.type === req.params.type.toUpperCase());
  if (!rate) {
    return res.status(404).json({ error: "Rate not found" });
  }
  if (typeof req.body.value !== "number" || req.body.value <= 0) {
    return res.status(400).json({ error: "value must be a positive number" });
  }
  rate.value = req.body.value;
  res.json(rate);
});

// DELETE /rates/:type — delete by type
app.delete("/rates/:type", (req, res) => {
  const index = rates.findIndex(r => r.type === req.params.type.toUpperCase());
  if (index === -1) {
    return res.status(404).json({ error: "Rate not found" });
  }
  rates.splice(index, 1);
  res.json({ message: "Deleted successfully" });
});

// GET /convert?from=X&to=Y&amount=Z — calculate conversion
app.get("/convert", (req, res) => {
  const { from, to, amount } = req.query;
  const fromRate = rates.find(r => r.type === from?.toUpperCase());
  const toRate = rates.find(r => r.type === to?.toUpperCase());
  if (!fromRate || !toRate) {
    return res.status(404).json({ error: "Rate not found" });
  }
  if (toRate.value === 0) {
    return res.status(400).json({ error: "Cannot divide by zero" });
  }
  const result = (Number(amount) * fromRate.value) / toRate.value;
  res.json({ from, to, amount: Number(amount), result });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Currency Q3 server on http://localhost:${PORT}`));
