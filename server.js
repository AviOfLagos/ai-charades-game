import express from "express";
import bodyParser from "body-parser";
import handler from "./api/generate-charades.js";

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());

// CORS middleware for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Express adapter for generate-charades
app.post("/api/generate-charades", async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
