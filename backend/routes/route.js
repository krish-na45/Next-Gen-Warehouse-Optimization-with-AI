const express = require("express");
const path    = require("path");
const fs      = require("fs");
const router  = express.Router();

// ── Check Python availability ──────────────────────────────────────────────
let pythonAvailable = false;
try {
  require("python-shell");
  pythonAvailable = true;
} catch (_) {}

// ── Pure-JS Dijkstra + greedy nearest-neighbour TSP ───────────────────────
function buildGraph(numAisles) {
  const graph = {};
  for (let i = 1; i <= numAisles; i++) graph[i] = [];

  // Sequential aisle connections
  for (let i = 1; i < numAisles; i++) {
    const dist = parseFloat((5.0 + (i % 3) * 2.5).toFixed(1));
    graph[i].push([i + 1, dist]);
    graph[i + 1].push([i, dist]);
  }
  // Cross-aisle shortcuts every 5 aisles
  for (let i = 1; i <= numAisles - 5; i += 5) {
    const shortcut = 3.0;
    graph[i].push([i + 5, shortcut]);
    graph[i + 5].push([i, shortcut]);
  }
  return graph;
}

function dijkstra(graph, start, end) {
  const dist = {};
  const prev = {};
  const visited = new Set();

  Object.keys(graph).forEach(n => { dist[n] = Infinity; prev[n] = null; });
  dist[start] = 0;

  // Min-heap via sorted array (fine for ≤30 nodes)
  const heap = [[0, start]];

  while (heap.length) {
    heap.sort((a, b) => a[0] - b[0]);
    const [d, u] = heap.shift();
    if (visited.has(u)) continue;
    visited.add(u);

    for (const [v, w] of (graph[u] || [])) {
      const nd = d + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        prev[v] = u;
        heap.push([nd, v]);
      }
    }
  }

  // Reconstruct path
  const pathArr = [];
  let cur = end;
  while (cur !== null) { pathArr.unshift(cur); cur = prev[cur]; }
  return { distance: parseFloat((dist[end] || 0).toFixed(2)), path: pathArr };
}

function optimizeRouteJS(aisles, startAisle = 1) {
  const maxAisle  = Math.max(...aisles, startAisle, 20);
  const graph     = buildGraph(maxAisle);
  let unvisited   = [...new Set(aisles)];
  let current     = startAisle;
  let totalDist   = 0;
  const fullPath  = [current];
  const order     = [];

  while (unvisited.length) {
    let bestDist = Infinity, bestNode = null, bestSeg = [];

    for (const target of unvisited) {
      const { distance, path } = dijkstra(graph, current, target);
      if (distance < bestDist) {
        bestDist = distance; bestNode = target; bestSeg = path;
      }
    }

    totalDist += bestDist;
    fullPath.push(...bestSeg.slice(1));
    order.push(bestNode);
    unvisited = unvisited.filter(a => a !== bestNode);
    current = bestNode;
  }

  // Return to start
  const { distance: backDist, path: backSeg } = dijkstra(graph, current, startAisle);
  totalDist += backDist;
  fullPath.push(...backSeg.slice(1));

  return {
    optimized_order:        order,
    full_path:              fullPath,
    total_distance_meters:  parseFloat(totalDist.toFixed(2)),
    estimated_time_minutes: parseFloat((totalDist / 50).toFixed(2)),
    engine:                 "js_dijkstra",
  };
}

// ── POST /api/optimize-route ───────────────────────────────────────────────
router.post("/", async (req, res) => {
  const { aisles = [], start_aisle = 1 } = req.body;

  if (!Array.isArray(aisles) || aisles.length === 0)
    return res.status(400).json({ error: "aisles array is required" });

  // ── Path A: Python ───────────────────────────────────────────────────────
  if (pythonAvailable) {
    try {
      const { PythonShell } = require("python-shell");
      const ML_DIR = path.join(__dirname, "../ml");

      // FIX: PythonShell.runString was removed in python-shell v5.
      // Use a temp script file approach via PythonShell instance instead.
      const scriptPath = path.join(ML_DIR, "optimize_route.py");

      const ps = new PythonShell(scriptPath, {
        pythonPath:    process.env.PYTHON_PATH || "python",
        pythonOptions: ["-u"],
        args:          [JSON.stringify(aisles), String(start_aisle)],
      });

      const messages = [];
      ps.on("message", (msg) => messages.push(msg));
      ps.on("stderr",  (err) => console.warn("Python route stderr:", err));

      ps.end((err) => {
        if (err || messages.length === 0) {
          console.warn("Python route failed, using JS:", err?.message);
          return res.json(optimizeRouteJS(aisles, parseInt(start_aisle)));
        }
        try {
          const result = JSON.parse(messages[messages.length - 1]);
          result.engine = "python_dijkstra";
          res.json(result);
        } catch {
          res.json(optimizeRouteJS(aisles, parseInt(start_aisle)));
        }
      });
      return;
    } catch (e) {
      console.warn("python-shell error:", e.message);
    }
  }

  // ── Path B: JS engine ────────────────────────────────────────────────────
  try {
    res.json(optimizeRouteJS(aisles, parseInt(start_aisle)));
  } catch (e) {
    res.status(500).json({ error: "Route optimization failed", detail: e.message });
  }
});

module.exports = router;
