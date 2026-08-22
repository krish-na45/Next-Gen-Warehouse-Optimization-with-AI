const express  = require("express");
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");
const router   = express.Router();

const PIPELINE_PKL = path.join(__dirname, "../models/pipeline_model.pkl");
const META_PKL     = path.join(__dirname, "../models/pipeline_meta.pkl");
const ML_DIR       = path.join(__dirname, "../ml");
const UPLOAD_DIR   = path.join(__dirname, "../uploads");

// Ensure uploads folder exists
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Multer config — accept CSV/Excel only ──────────────────────────────────
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename:    (_, file, cb) => cb(null, `upload_${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_, file, cb) => {
    const allowed = [".csv", ".xlsx", ".xls"];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV and Excel files are allowed"));
    }
  },
});

// ── Resolve Python path ────────────────────────────────────────────────────
function getPythonPath() {
  return process.env.PYTHON_PATH || "python";
}

// ── POST /api/upload/predict ───────────────────────────────────────────────
// Accepts a CSV/Excel file, runs batch prediction, returns JSON results
router.post("/predict", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  if (!fs.existsSync(PIPELINE_PKL) || !fs.existsSync(META_PKL)) {
    fs.unlinkSync(req.file.path);
    return res.status(500).json({ error: "Model not found. Run ml/ml_pipeline.py first." });
  }

  const filePath = req.file.path;

  try {
    const { PythonShell } = require("python-shell");

    const messages = [];
    const ps = new PythonShell("batch_predict.py", {
      scriptPath:    ML_DIR,
      pythonPath:    getPythonPath(),
      pythonOptions: ["-u"],
      args:          [filePath],
    });

    ps.on("message", (msg) => messages.push(msg));
    ps.on("stderr",  (err) => console.warn("Python stderr:", err));

    ps.end((err) => {
      // Clean up uploaded file
      try { fs.unlinkSync(filePath); } catch (_) {}

      if (err) {
        return res.status(500).json({ error: "Prediction failed", detail: err.message });
      }
      if (messages.length === 0) {
        return res.status(500).json({ error: "No output from prediction script" });
      }

      try {
        const output = JSON.parse(messages[messages.length - 1]);
        if (output.error) return res.status(400).json({ error: output.error });
        res.json(output);
      } catch (e) {
        res.status(500).json({ error: "Failed to parse prediction output", raw: messages.join("") });
      }
    });

  } catch (e) {
    try { fs.unlinkSync(filePath); } catch (_) {}
    res.status(500).json({ error: "python-shell error", detail: e.message });
  }
});

module.exports = router;
