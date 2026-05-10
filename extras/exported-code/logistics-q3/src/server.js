const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

let shipments = [];
let nextId = 1;

// GET /shipments — all shipments
app.get("/shipments", (req, res) => {
  res.json(shipments);
});

// POST /shipments — add shipment
app.post("/shipments", (req, res) => {
  const { sender, receiver, weight, destination } = req.body;
  if (!sender || !receiver || !weight || !destination) {
    return res.status(400).json({ error: "All fields required: sender, receiver, weight, destination" });
  }
  if (typeof weight !== "number" || weight <= 0) {
    return res.status(400).json({ error: "weight must be a positive number" });
  }
  const shipment = { id: nextId++, sender, receiver, weight, destination, status: "pending" };
  shipments.push(shipment);
  res.status(201).json(shipment);
});

// PUT /shipments/:id/status — update status
app.put("/shipments/:id/status", (req, res) => {
  const validStatuses = ["pending", "shipped", "delivered"];
  const { status } = req.body;
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status. Must be: pending, shipped, or delivered" });
  }
  const shipment = shipments.find(s => s.id === Number(req.params.id));
  if (!shipment) {
    return res.status(404).json({ error: "Shipment not found" });
  }
  shipment.status = status;
  res.json(shipment);
});

// DELETE /shipments/:id — delete shipment
app.delete("/shipments/:id", (req, res) => {
  const index = shipments.findIndex(s => s.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: "Shipment not found" });
  }
  shipments.splice(index, 1);
  res.json({ message: "Deleted successfully" });
});

// GET /shipments/heavy?min=X — filter by minimum weight
app.get("/shipments/heavy", (req, res) => {
  const min = Number(req.query.min) || 0;
  const heavy = shipments.filter(s => s.weight >= min);
  res.json(heavy);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Logistics Q3 server on http://localhost:${PORT}`));
