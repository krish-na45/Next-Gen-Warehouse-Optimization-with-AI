const express = require("express");
const path    = require("path");
const fs      = require("fs");
const router  = express.Router();

const METRICS_PATH = path.join(__dirname, "../models/model_metrics.json");

// GET /api/model-metrics  — public, no auth needed (read-only stats)
router.get("/", (req, res) => {
  if (!fs.existsSync(METRICS_PATH)) {
    return res.status(404).json({
      error: "Metrics not found. Run: python ml/ml_pipeline.py to train the model.",
    });
  }
  try {
    const metrics = JSON.parse(fs.readFileSync(METRICS_PATH, "utf8"));
    res.json(metrics);
  } catch (e) {
    res.status(500).json({ error: "Failed to read metrics file." });
  }
});

module.exports = router;
