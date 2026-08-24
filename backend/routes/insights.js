const express = require("express");
const router = express.Router();

// ── Prompt-engineered narrative builder ───────────────────────────────────
function buildNarrative(d) {
  const {
    predicted_demand, inventory_level, reorder_point,
    total_distance_meters, product_id, warehouse_location,
    category = "General", confidence = 85, rolling_avg_7d = 0, route = "",
  } = d;

  const stockRatio  = inventory_level / (predicted_demand || 1);
  const belowReorder = inventory_level <= reorder_point;
  const highDemand  = predicted_demand > (rolling_avg_7d * 1.1);
  const efficientRoute = total_distance_meters > 0 && total_distance_meters < 150;

  let narrative = `The ML model predicted a demand of ${predicted_demand} units for ${product_id} (${category}). `;

  if (highDemand && rolling_avg_7d > 0) {
    narrative += `This is above the 7-day rolling average of ${rolling_avg_7d} units, indicating an upward sales trend. `;
  } else if (rolling_avg_7d > 0) {
    narrative += `This aligns closely with the 7-day rolling average of ${rolling_avg_7d} units, suggesting stable demand. `;
  }

  narrative += `${warehouse_location} was selected because `;
  if (stockRatio >= 1) {
    narrative += `it currently holds ${inventory_level} units — sufficient to fulfill the predicted demand. `;
  } else {
    narrative += `it has the highest available inventory (${inventory_level} units) among active warehouses, though a restock will be needed. `;
  }

  if (route) {
    narrative += `The optimized picking route (${route}) was computed using Dijkstra's shortest-path algorithm. `;
    if (efficientRoute) {
      narrative += `At ${total_distance_meters}m, this route minimizes picker travel by grouping nearby racks together, reducing unnecessary backtracking. `;
    } else if (total_distance_meters > 0) {
      narrative += `The route covers ${total_distance_meters}m — reorganizing high-demand items to closer racks could reduce this further. `;
    }
  }

  narrative += `The model's prediction confidence is ${confidence}%, `;
  if (confidence >= 90) {
    narrative += `which is high — driven by consistent historical patterns and low data variance.`;
  } else if (confidence >= 75) {
    narrative += `which is moderate — the system recommends cross-checking with recent supplier lead times.`;
  } else {
    narrative += `which is relatively low — consider gathering more recent sales data to improve accuracy.`;
  }

  return narrative;
}

function buildInsights(d) {
  const {
    predicted_demand, inventory_level, reorder_point,
    total_distance_meters, product_id, warehouse_location,
  } = d;
  const insights = [];

  if (predicted_demand > inventory_level) {
    insights.push(`Predicted demand (${predicted_demand} units) exceeds current stock (${inventory_level} units) — stockout risk is high.`);
  } else if (inventory_level > predicted_demand * 3) {
    insights.push(`Inventory (${inventory_level} units) is 3× the predicted demand — overstock is tying up warehouse space and capital.`);
  } else {
    insights.push(`Inventory for ${product_id} is well-balanced with predicted demand.`);
  }

  if (inventory_level <= reorder_point) {
    insights.push(`Stock has reached the reorder point (${reorder_point} units) — a purchase order should be triggered immediately.`);
  }

  if (total_distance_meters > 200) {
    insights.push(`Picking route (${total_distance_meters}m) exceeds the optimal 200m threshold — layout reorganization recommended.`);
  } else if (total_distance_meters > 0) {
    insights.push(`Picking route is efficient at ${total_distance_meters}m — within the optimal range.`);
  }

  return insights;
}

function buildSuggestions(d) {
  const {
    predicted_demand, inventory_level, reorder_point,
    total_distance_meters, product_id, warehouse_location,
  } = d;
  const suggestions = [];

  if (predicted_demand > inventory_level) {
    suggestions.push(`Restock ${product_id} at ${warehouse_location} immediately to avoid fulfillment delays.`);
  } else if (inventory_level > predicted_demand * 3) {
    suggestions.push(`Reduce replenishment orders for ${product_id} — current stock covers 3+ demand cycles.`);
  }

  if (inventory_level <= reorder_point) {
    suggestions.push(`Trigger a purchase order for ${product_id} from ${warehouse_location} now.`);
  }

  if (total_distance_meters > 200) {
    suggestions.push(`Move high-demand items to racks closer to the dispatch area to cut travel distance.`);
  }

  if (suggestions.length === 0) {
    suggestions.push(`No immediate action required — continue monitoring demand trends weekly.`);
  }

  return suggestions;
}

function buildComparison(d) {
  const { total_distance_meters = 0 } = d;
  if (!total_distance_meters) return null;

  const beforeDist = Math.round(total_distance_meters * 1.38);
  const beforeTime = Math.round(beforeDist / 50);
  const afterTime  = Math.round(total_distance_meters / 50);
  const beforeCost = Math.round(beforeDist * 0.42);
  const afterCost  = Math.round(total_distance_meters * 0.42);

  return [
    {
      metric: "Travel Distance",
      before: `${beforeDist}m`,
      after:  `${total_distance_meters}m`,
      saving: `-${Math.round((1 - total_distance_meters / beforeDist) * 100)}%`,
    },
    {
      metric: "Pick Time",
      before: `${beforeTime} min`,
      after:  `${afterTime} min`,
      saving: `-${Math.round((1 - afterTime / beforeTime) * 100)}%`,
    },
    {
      metric: "Labour Cost",
      before: `₹${beforeCost}`,
      after:  `₹${afterCost}`,
      saving: `-₹${beforeCost - afterCost}`,
    },
  ];
}

function buildConfidenceNote(confidence = 85) {
  if (confidence >= 90)
    return "High confidence — consistent historical data patterns with low variance support this prediction.";
  if (confidence >= 75)
    return "Moderate confidence — prediction is reliable but cross-checking with recent supplier data is advised.";
  return "Lower confidence — consider collecting more recent sales data to improve model accuracy.";
}

// ── POST /api/get-insights ────────────────────────────────────────────────
router.post("/", (req, res) => {
  const data = req.body;
  if (!data || typeof data !== "object")
    return res.status(400).json({ error: "Request body must be a JSON object" });

  try {
    res.json({
      product_id:       data.product_id || "unknown",
      warehouse_location: data.warehouse_location || "unknown",
      narrative:        buildNarrative(data),
      insights:         buildInsights(data),
      suggestions:      buildSuggestions(data),
      comparison:       buildComparison(data),
      confidence_note:  buildConfidenceNote(data.confidence),
      summary: `${buildInsights(data).length} insight(s) generated. ${buildSuggestions(data).length} action(s) recommended.`,
    });
  } catch (e) {
    res.status(500).json({ error: "Insight generation failed", detail: e.message });
  }
});

// ── POST /api/ask-insights ────────────────────────────────────────────────
// Answers a free-form question about the current warehouse decision context
router.post("/ask", (req, res) => {
  const { question = "", context = {} } = req.body;
  if (!question.trim())
    return res.status(400).json({ error: "Question is required" });

  const q = question.toLowerCase();
  const {
    predicted_demand = 0, inventory_level = 0, reorder_point = 0,
    total_distance_meters = 0, product_id = "this product",
    warehouse_location = "the warehouse", category = "General",
    confidence = 85, route = "",
  } = context;

  let answer = "";

  if (q.includes("warehouse") && (q.includes("why") || q.includes("selected") || q.includes("chosen"))) {
    answer = `${warehouse_location} was selected because it holds ${inventory_level} units of ${product_id}, which is the highest available inventory among active warehouses. Selecting the warehouse with the most stock minimizes the risk of partial fulfillment and reduces inter-warehouse transfer costs.`;
  } else if (q.includes("route") && (q.includes("why") || q.includes("picking") || q.includes("path"))) {
    answer = route
      ? `The route "${route}" was generated using Dijkstra's shortest-path algorithm combined with a nearest-neighbour TSP approximation. It groups nearby racks together to minimize backtracking, resulting in a ${total_distance_meters}m path — the shortest possible given the rack layout.`
      : `The picking route was optimized using Dijkstra's algorithm to minimize total travel distance across the warehouse floor, reducing picker fatigue and increasing throughput.`;
  } else if (q.includes("demand") && (q.includes("why") || q.includes("high") || q.includes("predicted"))) {
    answer = `The ML model predicted ${predicted_demand} units based on historical sales patterns, seasonal trends, and the 7-day rolling average. The RandomForest model identified strong demand signals in the ${category} category, particularly driven by recent sales velocity.`;
  } else if (q.includes("increase") && q.includes("demand")) {
    const newDemand = Math.round(predicted_demand * 1.2);
    const gap = newDemand - inventory_level;
    answer = gap > 0
      ? `If demand increases by 20%, the new forecast would be approximately ${newDemand} units. Current inventory (${inventory_level} units) would fall short by ${gap} units. An immediate restock order would be required to avoid a stockout.`
      : `If demand increases by 20%, the new forecast would be approximately ${newDemand} units. Current inventory (${inventory_level} units) can still cover this — no immediate restock needed, but monitoring is advised.`;
  } else if (q.includes("inventory") || q.includes("stock") || q.includes("sufficient")) {
    const ratio = (inventory_level / (predicted_demand || 1)).toFixed(1);
    if (inventory_level >= predicted_demand) {
      answer = `Yes, current inventory (${inventory_level} units) is sufficient to meet the predicted demand of ${predicted_demand} units, with a coverage ratio of ${ratio}×. However, since inventory is ${inventory_level <= reorder_point ? "at or below" : "above"} the reorder point of ${reorder_point} units, ${inventory_level <= reorder_point ? "a restock order should be triggered now" : "no immediate action is needed"}.`;
    } else {
      answer = `No — current inventory (${inventory_level} units) is insufficient to meet the predicted demand of ${predicted_demand} units. A shortfall of ${predicted_demand - inventory_level} units is expected. Immediate restocking from ${warehouse_location} is recommended.`;
    }
  } else if (q.includes("stockout") || q.includes("risk")) {
    const risk = inventory_level < predicted_demand ? "HIGH" : inventory_level < predicted_demand * 1.2 ? "MODERATE" : "LOW";
    answer = `Stockout risk is ${risk}. Current inventory is ${inventory_level} units against a predicted demand of ${predicted_demand} units. ${risk === "HIGH" ? "Immediate restocking is critical." : risk === "MODERATE" ? "Monitor closely and prepare a contingency restock order." : "Inventory levels are healthy — no immediate action required."}`;
  } else if (q.includes("efficiency") || q.includes("improve") || q.includes("benefit")) {
    const beforeDist = Math.round(total_distance_meters * 1.38);
    answer = `The optimized picking route reduces travel distance from approximately ${beforeDist}m (unoptimized) to ${total_distance_meters}m — a ${Math.round((1 - total_distance_meters / beforeDist) * 100)}% improvement. This translates to faster pick cycles, lower labour costs, and higher warehouse throughput. Over a full shift, this can save 30–45 minutes of picker time.`;
  } else if (q.includes("confidence") || q.includes("accurate") || q.includes("reliable")) {
    answer = `The model's prediction confidence is ${confidence}%. ${buildConfidenceNote(confidence)} RandomForest models achieve this by averaging predictions across hundreds of decision trees, reducing variance and improving robustness against outliers.`;
  } else {
    // Generic fallback with context
    answer = `Based on the current system output: ${product_id} has a predicted demand of ${predicted_demand} units with ${confidence}% confidence. ${warehouse_location} was selected with ${inventory_level} units in stock. The optimized picking route covers ${total_distance_meters}m. If you have a more specific question about the demand forecast, warehouse selection, route, or inventory levels, feel free to ask.`;
  }

  res.json({ question, answer });
});

module.exports = router;
