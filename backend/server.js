require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const fs      = require("fs");
const path    = require("path");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS (allow localhost on any port) ────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) cb(null, true);
    else cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────
const authMiddleware  = require("./middleware/auth");
const authRoutes      = require("./routes/auth");
const agentAuthRoutes = require("./routes/agentAuth");
const contactRoutes   = require("./routes/contact");
const demandRoutes    = require("./routes/demand");
const routeRoutes     = require("./routes/route");
const insightsRoutes  = require("./routes/insights");
const dataRoutes      = require("./routes/data");
const uploadRoutes    = require("./routes/upload");
const metricsRoutes   = require("./routes/metrics");
const chatRoutes      = require("./routes/chat");

// Public routes (no login needed)
app.use("/api/auth",          authRoutes);
app.use("/api/agent",         agentAuthRoutes);   // agent login + company dashboard + public tracker
app.use("/api/contact",       contactRoutes);
app.use("/api/model-metrics", metricsRoutes);

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// Dataset stats (public — used on dashboard & landing)
const DATA_DIR = path.join(__dirname, "data");

app.get("/api/stats", (_req, res) => {
  try {
    const countRows = (file) => {
      const fp = path.join(DATA_DIR, file);
      if (!fs.existsSync(fp)) return 0;
      return fs.readFileSync(fp, "utf8").trim().split("\n").length - 1;
    };
    const avgCol = (lines, headers, col) => {
      const idx = headers.indexOf(col);
      if (idx === -1) return null;
      let sum = 0, count = 0;
      for (const l of lines) {
        const v = parseFloat(l.split(",")[idx]);
        if (!isNaN(v)) { sum += v; count++; }
      }
      return count ? parseFloat((sum / count).toFixed(2)) : null;
    };
    const readCSV = (file) => {
      const fp = path.join(DATA_DIR, file);
      if (!fs.existsSync(fp)) return null;
      const lines = fs.readFileSync(fp, "utf8").trim().split("\n");
      return { headers: lines[0].split(","), rows: lines.slice(1) };
    };

    const stats = {
      dataset_rows: {
        OrderList:             countRows("OrderList.csv"),
        FreightRates:          countRows("FreightRates.csv"),
        WhCosts:               countRows("WhCosts.csv"),
        WhCapacities:          countRows("WhCapacities.csv"),
        WarehousePickingData:  countRows("WarehousePickingData.csv"),
        PickingRoutes:         countRows("PickingRoutes.csv"),
        InventoryTransactions: countRows("InventoryTransactions.csv"),
        CarrierPerformance:    countRows("CarrierPerformance.csv"),
        WarehouseLayout:       countRows("WarehouseLayout.csv"),
        ProductsPerPlant:      countRows("ProductsPerPlant.csv"),
        PlantPorts:            countRows("PlantPorts.csv"),
        VmiCustomers:          countRows("VmiCustomers.csv"),
      },
    };

    const pick = readCSV("WarehousePickingData.csv");
    if (pick) stats.picking = {
      avg_demand:        avgCol(pick.rows, pick.headers, "demand"),
      avg_inventory:     avgCol(pick.rows, pick.headers, "inventory_level"),
      avg_picking_time:  avgCol(pick.rows, pick.headers, "picking_time_min"),
      avg_freight_cost:  avgCol(pick.rows, pick.headers, "freight_cost_usd"),
      avg_reorder_point: avgCol(pick.rows, pick.headers, "reorder_point"),
      avg_lead_time:     avgCol(pick.rows, pick.headers, "lead_time_days"),
    };

    const route = readCSV("PickingRoutes.csv");
    if (route) stats.routes = {
      avg_distance_m: avgCol(route.rows, route.headers, "total_distance_m"),
      avg_time_min:   avgCol(route.rows, route.headers, "total_time_min"),
      avg_items:      avgCol(route.rows, route.headers, "items_picked"),
      avg_stops:      avgCol(route.rows, route.headers, "num_stops"),
      total_routes:   route.rows.length,
    };

    const carrier = readCSV("CarrierPerformance.csv");
    if (carrier) {
      const shipIdx = carrier.headers.indexOf("total_shipments");
      let totalShipments = 0;
      carrier.rows.forEach((l) => {
        const v = parseFloat(l.split(",")[shipIdx]);
        if (!isNaN(v)) totalShipments += v;
      });
      stats.carrier = {
        avg_on_time_pct:       avgCol(carrier.rows, carrier.headers, "on_time_pct"),
        avg_cost_per_shipment: avgCol(carrier.rows, carrier.headers, "avg_cost_per_shipment"),
        avg_transit_days:      avgCol(carrier.rows, carrier.headers, "avg_transit_days"),
        total_shipments:       totalShipments,
      };
    }

    const inv = readCSV("InventoryTransactions.csv");
    if (inv) stats.inventory = {
      avg_quantity:   avgCol(inv.rows, inv.headers, "quantity"),
      avg_unit_cost:  avgCol(inv.rows, inv.headers, "unit_cost"),
      avg_total_cost: avgCol(inv.rows, inv.headers, "total_cost"),
    };

    const metricsFp = path.join(__dirname, "models/model_metrics.json");
    if (fs.existsSync(metricsFp)) stats.ml = JSON.parse(fs.readFileSync(metricsFp, "utf8"));

    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: "Failed to compute stats" });
  }
});

// Protected routes (require login)
app.use("/api/predict-demand", authMiddleware, demandRoutes);
app.use("/api/optimize-route", authMiddleware, routeRoutes);
app.use("/api/get-insights",   authMiddleware, insightsRoutes);
app.use("/api/data",           authMiddleware, dataRoutes);
app.use("/api/upload",         authMiddleware, uploadRoutes);
app.use("/api/chat",           authMiddleware, chatRoutes);

app.listen(PORT, () =>
  console.log(`✅  Warehouse AI backend running on http://localhost:${PORT}`)
);
