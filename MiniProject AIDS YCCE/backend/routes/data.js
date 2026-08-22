const express = require("express");
const fs      = require("fs");
const path    = require("path");
const router  = express.Router();

const DATA_DIR = path.join(__dirname, "../data");

const ALLOWED = [
  "OrderList", "FreightRates", "WhCosts", "WhCapacities",
  "ProductsPerPlant", "PlantPorts", "VmiCustomers",
  "WarehousePickingData", "WarehouseLayout", "PickingRoutes",
  "InventoryTransactions", "CarrierPerformance",
];

// ── CSV parser (handles quoted fields with commas) ──────────────────────────
function parseCSVLine(line) {
  const result = [];
  let cur = "", inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === "," && !inQuote) { result.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  result.push(cur.trim());
  return result;
}

function readCSV(filename, limit = 100) {
  const fp = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fp)) return null;

  const lines = fs.readFileSync(fp, "utf8").trim().split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows    = [];

  for (let i = 1; i <= Math.min(limit, lines.length - 1); i++) {
    const vals = parseCSVLine(lines[i]);
    const obj  = {};
    headers.forEach((h, idx) => { obj[h] = vals[idx] ?? ""; });
    rows.push(obj);
  }
  return { headers, rows, total: lines.length - 1 };
}

// ── GET /api/data/stats — live aggregated stats from all datasets ───────────
router.get("/stats", (req, res) => {
  try {
    const stats = {};

    // Helper: count rows
    const countRows = (file) => {
      const fp = path.join(DATA_DIR, file);
      if (!fs.existsSync(fp)) return 0;
      return fs.readFileSync(fp, "utf8").trim().split("\n").length - 1;
    };

    // Helper: compute column averages
    const avgCol = (lines, headers, col) => {
      const idx = headers.indexOf(col);
      if (idx === -1) return null;
      let sum = 0, count = 0;
      lines.forEach(l => {
        const v = parseFloat(l.split(",")[idx]);
        if (!isNaN(v)) { sum += v; count++; }
      });
      return count ? parseFloat((sum / count).toFixed(2)) : null;
    };

    // ── Dataset row counts ──────────────────────────────────────────────────
    stats.dataset_rows = {
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
    };

    // ── WarehousePickingData averages ───────────────────────────────────────
    const pickFp = path.join(DATA_DIR, "WarehousePickingData.csv");
    if (fs.existsSync(pickFp)) {
      const pickLines = fs.readFileSync(pickFp, "utf8").trim().split("\n");
      const pickHeaders = pickLines[0].split(",");
      const dataLines = pickLines.slice(1);
      stats.picking = {
        avg_demand:        avgCol(dataLines, pickHeaders, "demand"),
        avg_inventory:     avgCol(dataLines, pickHeaders, "inventory_level"),
        avg_picking_time:  avgCol(dataLines, pickHeaders, "picking_time_min"),
        avg_freight_cost:  avgCol(dataLines, pickHeaders, "freight_cost_usd"),
        avg_reorder_point: avgCol(dataLines, pickHeaders, "reorder_point"),
        avg_lead_time:     avgCol(dataLines, pickHeaders, "lead_time_days"),
      };
    }

    // ── PickingRoutes averages ──────────────────────────────────────────────
    const routeFp = path.join(DATA_DIR, "PickingRoutes.csv");
    if (fs.existsSync(routeFp)) {
      const routeLines = fs.readFileSync(routeFp, "utf8").trim().split("\n");
      const routeHeaders = routeLines[0].split(",");
      const dataLines = routeLines.slice(1);
      stats.routes = {
        avg_distance_m:  avgCol(dataLines, routeHeaders, "total_distance_m"),
        avg_time_min:    avgCol(dataLines, routeHeaders, "total_time_min"),
        avg_items:       avgCol(dataLines, routeHeaders, "items_picked"),
        avg_stops:       avgCol(dataLines, routeHeaders, "num_stops"),
        total_routes:    dataLines.length,
      };
    }

    // ── CarrierPerformance averages ─────────────────────────────────────────
    const carrierFp = path.join(DATA_DIR, "CarrierPerformance.csv");
    if (fs.existsSync(carrierFp)) {
      const carrierLines = fs.readFileSync(carrierFp, "utf8").trim().split("\n");
      const carrierHeaders = carrierLines[0].split(",");
      const dataLines = carrierLines.slice(1);
      let totalShipments = 0;
      const shipIdx = carrierHeaders.indexOf("total_shipments");
      dataLines.forEach(l => {
        const v = parseFloat(l.split(",")[shipIdx]);
        if (!isNaN(v)) totalShipments += v;
      });
      stats.carrier = {
        avg_on_time_pct:       avgCol(dataLines, carrierHeaders, "on_time_pct"),
        avg_cost_per_shipment: avgCol(dataLines, carrierHeaders, "avg_cost_per_shipment"),
        avg_transit_days:      avgCol(dataLines, carrierHeaders, "avg_transit_days"),
        total_shipments:       totalShipments,
      };
    }

    // ── InventoryTransactions averages ──────────────────────────────────────
    const invFp = path.join(DATA_DIR, "InventoryTransactions.csv");
    if (fs.existsSync(invFp)) {
      const invLines = fs.readFileSync(invFp, "utf8").trim().split("\n");
      const invHeaders = invLines[0].split(",");
      const dataLines = invLines.slice(1);
      stats.inventory = {
        avg_quantity:   avgCol(dataLines, invHeaders, "quantity"),
        avg_unit_cost:  avgCol(dataLines, invHeaders, "unit_cost"),
        avg_total_cost: avgCol(dataLines, invHeaders, "total_cost"),
      };
    }

    // ── ML model metrics ────────────────────────────────────────────────────
    const metricsFp = path.join(__dirname, "../models/model_metrics.json");
    if (fs.existsSync(metricsFp)) {
      stats.ml = JSON.parse(fs.readFileSync(metricsFp, "utf8"));
    }

    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: "Failed to compute stats", detail: e.message });
  }
});

// ── GET /api/data/summary ───────────────────────────────────────────────────
router.get("/summary", (req, res) => {
  const summary = {};
  ALLOWED.forEach((name) => {
    const fp = path.join(DATA_DIR, `${name}.csv`);
    if (fs.existsSync(fp)) {
      const lines = fs.readFileSync(fp, "utf8").trim().split("\n");
      summary[`${name}.csv`] = {
        rows:    lines.length - 1,
        columns: parseCSVLine(lines[0]).length,
        status:  "ready",
      };
    } else {
      summary[`${name}.csv`] = { rows: 0, columns: 0, status: "not_generated" };
    }
  });
  res.json(summary);
});

// ── GET /api/data/:dataset?limit=50 ────────────────────────────────────────
router.get("/:dataset", (req, res) => {
  const { dataset } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 50, 500);

  // ── Special route: stats ──────────────────────────────────────────────────
  if (dataset === "stats") {
    try {
      const stats = {};

      const countRows = (file) => {
        const fp = path.join(DATA_DIR, file);
        if (!fs.existsSync(fp)) return 0;
        return fs.readFileSync(fp, "utf8").trim().split("\n").length - 1;
      };

      const avgCol = (lines, headers, col) => {
        const idx = headers.indexOf(col);
        if (idx === -1) return null;
        let sum = 0, count = 0;
        lines.forEach(l => {
          const v = parseFloat(l.split(",")[idx]);
          if (!isNaN(v)) { sum += v; count++; }
        });
        return count ? parseFloat((sum / count).toFixed(2)) : null;
      };

      stats.dataset_rows = {
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
      };

      const pickFp = path.join(DATA_DIR, "WarehousePickingData.csv");
      if (fs.existsSync(pickFp)) {
        const pickLines = fs.readFileSync(pickFp, "utf8").trim().split("\n");
        const pickHeaders = pickLines[0].split(",");
        const dataLines = pickLines.slice(1);
        stats.picking = {
          avg_demand:        avgCol(dataLines, pickHeaders, "demand"),
          avg_inventory:     avgCol(dataLines, pickHeaders, "inventory_level"),
          avg_picking_time:  avgCol(dataLines, pickHeaders, "picking_time_min"),
          avg_freight_cost:  avgCol(dataLines, pickHeaders, "freight_cost_usd"),
          avg_reorder_point: avgCol(dataLines, pickHeaders, "reorder_point"),
          avg_lead_time:     avgCol(dataLines, pickHeaders, "lead_time_days"),
        };
      }

      const routeFp = path.join(DATA_DIR, "PickingRoutes.csv");
      if (fs.existsSync(routeFp)) {
        const routeLines = fs.readFileSync(routeFp, "utf8").trim().split("\n");
        const routeHeaders = routeLines[0].split(",");
        const dataLines = routeLines.slice(1);
        stats.routes = {
          avg_distance_m: avgCol(dataLines, routeHeaders, "total_distance_m"),
          avg_time_min:   avgCol(dataLines, routeHeaders, "total_time_min"),
          avg_items:      avgCol(dataLines, routeHeaders, "items_picked"),
          avg_stops:      avgCol(dataLines, routeHeaders, "num_stops"),
          total_routes:   dataLines.length,
        };
      }

      const carrierFp = path.join(DATA_DIR, "CarrierPerformance.csv");
      if (fs.existsSync(carrierFp)) {
        const carrierLines = fs.readFileSync(carrierFp, "utf8").trim().split("\n");
        const carrierHeaders = carrierLines[0].split(",");
        const dataLines = carrierLines.slice(1);
        let totalShipments = 0;
        const shipIdx = carrierHeaders.indexOf("total_shipments");
        dataLines.forEach(l => {
          const v = parseFloat(l.split(",")[shipIdx]);
          if (!isNaN(v)) totalShipments += v;
        });
        stats.carrier = {
          avg_on_time_pct:       avgCol(dataLines, carrierHeaders, "on_time_pct"),
          avg_cost_per_shipment: avgCol(dataLines, carrierHeaders, "avg_cost_per_shipment"),
          avg_transit_days:      avgCol(dataLines, carrierHeaders, "avg_transit_days"),
          total_shipments:       totalShipments,
        };
      }

      const invFp = path.join(DATA_DIR, "InventoryTransactions.csv");
      if (fs.existsSync(invFp)) {
        const invLines = fs.readFileSync(invFp, "utf8").trim().split("\n");
        const invHeaders = invLines[0].split(",");
        const dataLines = invLines.slice(1);
        stats.inventory = {
          avg_quantity:   avgCol(dataLines, invHeaders, "quantity"),
          avg_unit_cost:  avgCol(dataLines, invHeaders, "unit_cost"),
          avg_total_cost: avgCol(dataLines, invHeaders, "total_cost"),
        };
      }

      const metricsFp = path.join(__dirname, "../models/model_metrics.json");
      if (fs.existsSync(metricsFp)) {
        stats.ml = JSON.parse(fs.readFileSync(metricsFp, "utf8"));
      }

      return res.json(stats);
    } catch (e) {
      return res.status(500).json({ error: "Failed to compute stats", detail: e.message });
    }
  }

  // ── Special route: summary ────────────────────────────────────────────────
  if (dataset === "summary") {
    const summary = {};
    ALLOWED.forEach((name) => {
      const fp = path.join(DATA_DIR, `${name}.csv`);
      if (fs.existsSync(fp)) {
        const lines = fs.readFileSync(fp, "utf8").trim().split("\n");
        summary[`${name}.csv`] = {
          rows:    lines.length - 1,
          columns: parseCSVLine(lines[0]).length,
          status:  "ready",
        };
      } else {
        summary[`${name}.csv`] = { rows: 0, columns: 0, status: "not_generated" };
      }
    });
    return res.json(summary);
  }

  if (!ALLOWED.includes(dataset)) {
    return res.status(404).json({ error: `Unknown dataset "${dataset}"` });
  }

  const result = readCSV(`${dataset}.csv`, limit);
  if (!result) {
    return res.status(404).json({
      error: `"${dataset}.csv" not found. Run: python ml/generate_supply_chain_dataset.py`,
    });
  }

  res.json({
    dataset,
    total:    result.total,
    returned: result.rows.length,
    columns:  result.headers,
    data:     result.rows,
  });
});

module.exports = router;
