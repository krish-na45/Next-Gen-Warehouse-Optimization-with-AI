// Quick integration test — run with: node test_model.js
const { PythonShell } = require("python-shell");
const path = require("path");

const input = {
  product_id: "P001", warehouse_location: "Zone-A", category: "Electronics",
  aisle_number: 3, inventory_level: 250, reorder_point: 80,
  lead_time_days: 5, unit_price: 199.99, day_of_week: 2, month: 4, is_weekend: 0,
};

console.log("Testing pipeline model via python-shell...");

const messages = [];
const ps = new PythonShell("predict_pipeline.py", {
  scriptPath:    path.join(__dirname, "ml"),
  pythonPath:    process.env.PYTHON_PATH || "python",
  pythonOptions: ["-u"],
  args:          [JSON.stringify(input)],
});

ps.on("message", (msg) => messages.push(msg));
ps.on("stderr",  (err) => console.warn("stderr:", err));

ps.end((err) => {
  if (err) { console.error("❌ Error:", err.message); return; }
  try {
    const output = JSON.parse(messages[messages.length - 1]);
    console.log("✅ Prediction result:", output);
  } catch (e) {
    console.error("❌ Parse error:", e.message, "Raw:", messages);
  }
});
