const express = require("express");
const path    = require("path");
const fs      = require("fs");
const router  = express.Router();

const ML_DIR       = path.join(__dirname, "../ml");
const PIPELINE_PKL = path.join(__dirname, "../models/pipeline_model.pkl");
const META_PKL     = path.join(__dirname, "../models/pipeline_meta.pkl");

// ── Check Python + pipeline model availability ─────────────────────────────
let pythonAvailable = false;
try {
  require("python-shell");
  if (fs.existsSync(PIPELINE_PKL) && fs.existsSync(META_PKL)) {
    pythonAvailable = true;
    console.log("✅  Pipeline model found — Python RF engine active.");
  }
} catch (_) {
  console.warn("⚠️  python-shell not found — using JS fallback.");
}

// ── Resolve Python executable (handles conda/venv on Windows) ─────────────
function getPythonPath() {
  return (
    process.env.PYTHON_PATH ||               // allow override via .env
    "python"  // use python from PATH
  );
}

// ── Pure-JS demand engine (fallback when Python unavailable) ───────────────
function predictDemandJS(input) {
  const {
    inventory_level = 250, reorder_point = 80,  rolling_avg_7d = 45,
    lead_time_days  = 5,   unit_price    = 100,  aisle_number   = 5,
    day_of_week     = 2,   month         = 6,    is_weekend     = 0,
    category        = "Electronics",
  } = input;

  let demand = parseFloat(rolling_avg_7d) * 1.05;

  const stockRatio = parseFloat(inventory_level) / (parseFloat(reorder_point) + 1);
  if (stockRatio < 1)        demand *= 1.25;
  else if (stockRatio < 1.5) demand *= 1.10;

  demand += parseFloat(lead_time_days) * 0.8;

  const price = parseFloat(unit_price);
  if (price > 300)     demand *= 0.92;
  else if (price < 50) demand *= 1.08;

  demand += Math.max(0, (10 - parseFloat(aisle_number))) * 0.5;

  const seasonality = [0,0.95,0.90,0.98,1.02,1.05,1.10,1.08,1.12,1.15,1.20,1.30,1.35];
  demand *= seasonality[Math.min(parseInt(month), 12)] || 1.0;

  if (parseInt(is_weekend) === 1) demand *= 1.15;

  const dowFactor = [1.0,1.05,1.08,1.06,1.10,1.18,1.15];
  demand *= dowFactor[Math.min(parseInt(day_of_week), 6)] || 1.0;

  const catMap = {
    Electronics:1.12, Grocery:1.20, Apparel:1.05, Tools:0.95,
    Furniture:0.88, Pharmaceuticals:1.18, Automotive:0.92,
    Chemicals:0.90, Textiles:1.00, Machinery:0.85,
  };
  demand *= catMap[category] || 1.0;
  demand += (Math.random() - 0.5) * 3;

  return Math.max(1, Math.round(demand));
}

// ── Python prediction using instance-based PythonShell (Windows-safe) ─────
function predictWithPython(input) {
  return new Promise((resolve, reject) => {
    const { PythonShell } = require("python-shell");

    const messages = [];
    const ps = new PythonShell("predict_pipeline.py", {
      scriptPath:    ML_DIR,
      pythonPath:    getPythonPath(),
      pythonOptions: ["-u"],
      args:          [JSON.stringify(input)],
    });

    ps.on("message", (msg) => messages.push(msg));
    ps.on("stderr",  (err) => console.warn("Python stderr:", err));

    ps.end((err) => {
      if (err) return reject(err);
      if (messages.length === 0) return reject(new Error("No output from Python"));
      try {
        const output = JSON.parse(messages[messages.length - 1]);
        if (output.error) return reject(new Error(output.error));
        resolve(output);
      } catch (e) {
        reject(new Error("Failed to parse Python output: " + messages.join("")));
      }
    });
  });
}

// ── POST /api/predict-demand ───────────────────────────────────────────────
router.post("/", async (req, res) => {
  const input = req.body;

  if (!input || typeof input !== "object") {
    return res.status(400).json({ error: "Request body must be a JSON object" });
  }

  // ── Path A: sklearn pipeline model (Python RF) ───────────────────────────
  if (pythonAvailable) {
    try {
      const result = await predictWithPython(input);
      return res.json(result);
    } catch (e) {
      console.warn("⚠️  Python prediction failed, falling back to JS:", e.message);
    }
  }

  // ── Path B: JS rule-based engine ─────────────────────────────────────────
  try {
    const predicted_demand = predictDemandJS(input);
    return res.json({ predicted_demand, engine: "js_rule_based" });
  } catch (e) {
    res.status(500).json({ error: "Prediction failed", detail: e.message });
  }
});

module.exports = router;
