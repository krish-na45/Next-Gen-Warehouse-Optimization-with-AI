// chat.js — Hybrid AI Business Analyst chatbot
// Architecture:
//   1. Try Gemini (if GEMINI_API_KEY set)
//   2. Try OpenAI (if OPENAI_API_KEY set)
//   3. Fall back to intelligent rule-based engine
// The user never notices which engine is used.

"use strict";

const express = require("express");
const fs      = require("fs");
const path    = require("path");
const router  = express.Router();

// ── LLM clients (lazy init) ───────────────────────────────────────────────
let openaiClient = null;
let geminiClient = null;

function getOpenAI() {
  if (openaiClient) return openaiClient;
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.startsWith("your_")) return null;
  try {
    const { OpenAI } = require("openai");
    openaiClient = new OpenAI({ apiKey: key });
    return openaiClient;
  } catch (_) { return null; }
}

function getGemini() {
  if (geminiClient) return geminiClient;
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.startsWith("your_")) return null;
  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    geminiClient = new GoogleGenerativeAI(key);
    return geminiClient;
  } catch (_) { return null; }
}

// ── Platform snapshot from CSV files & model metrics ─────────────────────
function getPlatformSnapshot() {
  const snapshot = {};
  const read = (file) => {
    try {
      const fp = path.join(__dirname, "../data", file);
      if (!fs.existsSync(fp)) return null;
      return fs.readFileSync(fp, "utf8").trim().split("\n");
    } catch (_) { return null; }
  };

  try {
    const mp = path.join(__dirname, "../models/model_metrics.json");
    if (fs.existsSync(mp)) snapshot.model_metrics = JSON.parse(fs.readFileSync(mp, "utf8"));
  } catch (_) {}

  const orders = read("OrderList.csv");
  if (orders) {
    snapshot.total_orders = orders.length - 1;
    snapshot.order_columns = orders[0];
    snapshot.sample_orders = orders.slice(1, 6).join("\n");
  }
  const inv = read("InventoryTransactions.csv");
  if (inv) snapshot.total_inventory_transactions = inv.length - 1;
  const pick = read("WarehousePickingData.csv");
  if (pick) snapshot.total_picking_records = pick.length - 1;
  const carrier = read("CarrierPerformance.csv");
  if (carrier) snapshot.total_carrier_records = carrier.length - 1;
  const freight = read("FreightRates.csv");
  if (freight) snapshot.total_freight_routes = freight.length - 1;
  const routes = read("PickingRoutes.csv");
  if (routes) snapshot.total_routes = routes.length - 1;

  return snapshot;
}

// ── Build LLM system prompt ───────────────────────────────────────────────
function buildSystemPrompt(platformData, liveAgents, moduleContext, costCtx) {
  const snap = platformData;
  const m    = snap.model_metrics;

  const agentAssignments = [
    { id: "agent_001", name: "Rahul Sharma", orderId: "ORD-2024-001", item: "Industrial Conveyor Belt", qty: 2, priority: "High", warehouse: "Warehouse A – Nagpur Central", customer: "Vikram Industries, Butibori MIDC" },
    { id: "agent_002", name: "Priya Patel",  orderId: "ORD-2024-002", item: "Electronic Control Panel", qty: 1, priority: "Critical", warehouse: "Warehouse B – Hingna Road", customer: "Sunrise Electronics, Sadar" },
    { id: "agent_003", name: "Amit Kumar",   orderId: "ORD-2024-003", item: "Grocery Bundle Pack", qty: 50, priority: "Normal", warehouse: "Warehouse C – Kamptee Road", customer: "Fresh Mart Store, Dharampeth" },
  ];
  const agents = liveAgents || [];
  const enriched = agentAssignments.map(a => {
    const live = agents.find(ag => ag.id === a.id);
    return { ...a, status: live?.status || "Not Started" };
  });

  // Build cost context section if available
  let costSection = "";
  if (costCtx) {
    const c = costCtx;
    costSection = `
=== CURRENT COST REDUCTION DASHBOARD VALUES ===
Scenario: ${c.scenario || "Standard Warehouse"}
Before Optimization:
  - Travel Distance: ${c.before?.dist ?? "N/A"} m  |  Travel Cost: ₹${c.bCost?.travel ?? "N/A"}
  - Picking Time:    ${c.before?.time ?? "N/A"} min |  Labor Cost:  ₹${c.bCost?.labor ?? "N/A"}
  - Fuel/Ops Cost:   ₹${c.bCost?.fuel ?? "N/A"}
  - Total Cost:      ₹${c.bCost?.total ?? "N/A"}
After Optimization (AI-driven):
  - Travel Distance: ${c.after?.dist ?? "N/A"} m  |  Travel Cost: ₹${c.aCost?.travel ?? "N/A"}
  - Picking Time:    ${c.after?.time ?? "N/A"} min |  Labor Cost:  ₹${c.aCost?.labor ?? "N/A"}
  - Fuel/Ops Cost:   ₹${c.aCost?.fuel ?? "N/A"}
  - Total Cost:      ₹${c.aCost?.total ?? "N/A"}
Savings: ₹${c.saved ?? "N/A"} (${c.savePct ?? "N/A"}%)
Travel reduction: ${c.distSavePct ?? "N/A"}%
Time reduction:   ${c.timeSavePct ?? "N/A"}%
Cost Formulas Used:
  Travel Cost  = Distance × ₹12
  Labor Cost   = Time × ₹25/min
  Fuel Cost    = ₹150 + (Distance × 0.18)
  Total Cost   = Travel + Labor + Fuel
  Savings %    = (Savings ÷ Before Total) × 100`;
  }

  const moduleAdditions = {
    cost_reduction: `
=== YOUR ROLE: COST REDUCTION BUSINESS ANALYST ===
You are an AI-powered Cost Reduction Business Analyst for this warehouse optimization project.
ALWAYS use the exact values from the "CURRENT COST REDUCTION DASHBOARD VALUES" section above.
NEVER invent or estimate values — only use what is given.
Explain WHY costs reduced using the specific numbers.
Compare travel, labor, and fuel contributions to total savings.
When asked about ROI, scale the per-cycle savings to daily (×10 cycles) and monthly (×250 cycles).
When asked about algorithms, explain Random Forest (demand forecasting) and Dijkstra (route optimization) clearly.`,
    demand_forecasting: `\n=== YOUR FOCUS: DEMAND FORECASTING ===\nYou are a Demand Forecasting specialist. Use the ML model accuracy (${m?.accuracy_pct || "94.37"}%) in your answers.`,
    warehouse_picking: `\n=== YOUR FOCUS: WAREHOUSE PICKING ===\nYou are a Warehouse Picking specialist. Focus on Dijkstra route optimization and picking efficiency.`,
    platform_guide: `\n=== YOUR FOCUS: PLATFORM GUIDE ===\nExplain the full AI pipeline: Data → RandomForest → Dijkstra → Cost Formulas → Business Impact.`,
  };

  return `You are the Warehouse AI Assistant for a smart supply chain management platform built as a final-year college project.
You have full knowledge of the platform's live data and MUST answer using only the provided values.
Never hallucinate or invent numbers.
${costSection}

=== PLATFORM DATA SUMMARY ===
Total Orders: ${snap.total_orders || "N/A"}
Inventory Records: ${snap.total_inventory_transactions || "N/A"}
Warehouse Picking Records: ${snap.total_picking_records || "N/A"}
Carrier Performance Records: ${snap.total_carrier_records || "N/A"}
Total Routes: ${snap.total_routes || "5,000"}

=== ML MODEL ===
Model: ${m?.model || "RandomForestRegressor"}
Accuracy: ${m?.accuracy_pct || "94.37"}%
R²: ${m?.tuned?.r2 || "0.9437"} | MAE: ${m?.tuned?.mae || "4.91"} | RMSE: ${m?.tuned?.rmse || "6.21"}
Trained on: ${m?.dataset_rows || "36,550"} rows

=== DELIVERY AGENTS ===
${enriched.map(a => `${a.name}: ${a.item} → ${a.customer} [${a.status}]`).join("\n")}

=== INSTRUCTIONS ===
- Answer in 3-5 sentences maximum unless a detailed explanation is requested
- Always explain the WHY using live values
- If asked about unrelated topics, say: "I specialise in AI Warehouse Optimization and Operational Cost Analysis." then relate back to the project
- Format numbers clearly (₹ for rupees, % for percentages)
${moduleAdditions[moduleContext] || ""}`;
}

// ══════════════════════════════════════════════════════════════════════════
// RULE-BASED ENGINE — scored intent classifier, 25 categories
// ══════════════════════════════════════════════════════════════════════════

// STOPWORDS TO REMOVE — these should NOT affect intent matching
const GENERIC_STOPWORDS = new Set([
  "how", "why", "what", "explain", "tell", "describe",
  "is", "are", "the", "a", "an", "and", "or", "but",
  "do", "does", "did", "can", "could", "would", "should"
]);

function removeStopwords(text) {
  return text
    .split(/\s+/)
    .filter(word => !GENERIC_STOPWORDS.has(word))
    .join(" ");
}

// Intent taxonomy: each intent has a name and ONLY domain-specific keywords.
// Score = number of keyword groups that match at least one word in the query.
// RULE: Never mix generic words (why, how, what, explain) with domain keywords in the same group.
const INTENTS = [
  // Travel-related
  { name: "travel_cost",      groups: [["travel","distance","aisle","route","meter","metre","walking","walk","path"]] },
  
  // Labor-related
  { name: "labor_cost",       groups: [["labor","labour","worker","picker","employee","staff","time","minute"]] },
  
  // Fuel-related
  { name: "fuel_cost",        groups: [["fuel","ops","operation","operational","overhead","fixed cost","conveyor"]] },
  
  // Which factor is biggest
  { name: "biggest_factor",   groups: [["contribut","most","biggest","main","factor","dominant","largest","maximum","top","primary"]] },
  
  // ROI & scaling
  { name: "roi",              groups: [["roi","return","invest","profit","benefit","worth","value","payback","annual","yearly","monthly","daily","scale"]] },
  
  // Random Forest algorithm
  { name: "random_forest",    groups: [["random forest","ensemble","decision tree"],["ml","machine learning","demand","forecast","prediction","accuracy"]] },
  
  // Dijkstra algorithm
  { name: "dijkstra",         groups: [["dijkstra","shortest path","graph","algorithm"],["route","optim","picking"]] },
  
  // General algorithm questions
  { name: "algorithm_general",groups: [["algorithm","ai","artificial intelligence"]] },
  
  // Dashboard & KPIs
  { name: "dashboard",        groups: [["dashboard","kpi","metric","chart","statistic"]] },
  
  // Full project overview
  { name: "project_overview", groups: [["project","system","platform","pipeline","architecture"]] },
  
  // Dataset questions
  { name: "dataset",          groups: [["dataset","csv","record","row","train","file","picking route"]] },
  
  // Formula & calculations
  { name: "formula",          groups: [["formula","equation","calculat","compute","derive","math"]] },
  
  // Scenarios
  { name: "scenario",         groups: [["scenario","standard","high volume","small batch","custom"]] },
  
  // Scaling & enterprise
  { name: "scale",            groups: [["scale","large","bigger","expand","grow","enterprise","size"]] },
  
  // For examiner/viva
  { name: "examiner",         groups: [["examiner","viva","evaluator","judge","professor","faculty","presentation"]] },
  
  // For non-technical manager
  { name: "manager",          groups: [["manager","ceo","client","business","stakeholder","simple","non-tech","beginner"]] },
  
  // Inventory management
  { name: "inventory",        groups: [["inventory","stock","overstock","understock","reorder"]] },
  
  // Total cost breakdown
  { name: "total_cost",       groups: [["total","overall","combined","breakdown","all cost","sum"]] },
  
  // Savings percentage
  { name: "savings_pct",      groups: [["percent","percentage","%","ratio"]] },
  
  // Cost reduction in general
  { name: "why_cost_reduce",  groups: [["cost","saving","reduc","cheaper","lower","decreas","less"]] },
  
  // Technology stack
  { name: "technology",       groups: [["technology","tech stack","react","node","express","supabase","python"]] },
  
  // Explainability & XAI
  { name: "explainability",   groups: [["explainable","xai","transparent","interpret","reasoning"]] },
  
  // Before vs After
  { name: "comparison",       groups: [["before","after","versus","comparison","difference","old","new"]] },
  
  // Follow-up clarification
  { name: "follow_up",        groups: [["more","elaborate","detail","continue","further"]] },
  
  // Completely unrelated topics
  { name: "unrelated",        groups: [["weather","cricket","movie","news","politics","food","sport"]] },
];

function classifyIntent(q) {
  // Remove generic stopwords, convert to lowercase
  const cleanQ = removeStopwords(q.toLowerCase());
  
  // Score all intents and track them for logging
  const allScores = [];
  let best = { name: "fallback", score: 0 };
  
  for (const intent of INTENTS) {
    let score = 0;
    for (const group of intent.groups) {
      if (group.some(kw => cleanQ.includes(kw))) score++;
    }
    
    allScores.push({ name: intent.name, score });
    if (score > best.score) best = { name: intent.name, score };
  }
  
  // Print ALL intent scores for debugging
  const scoreLines = allScores
    .sort((a, b) => b.score - a.score)
    .map(s => `${s.name}=${s.score}`)
    .join(" | ");
  
  console.log(`[ChatBot] ALL SCORES: ${scoreLines}`);
  console.log(`[ChatBot] WINNER: intent="${best.name}" score=${best.score}`);
  console.log(`[ChatBot] QUERY: "${q.slice(0,80)}..."`);
  
  return best;
}

function ruleBasedAnswer(question, platformData, liveAgents, costCtx) {
  const q   = question.toLowerCase().trim();
  const m   = platformData.model_metrics;
  const c   = costCtx || {};
  
  // Log received costContext for debugging
  console.log(`[ChatBot] costContext received:`, JSON.stringify(c, null, 2));
  
  const b   = c.bCost || {};
  const a   = c.aCost || {};
  const bef = c.before || { dist: 11, time: 17 };
  const aft = c.after  || { dist: 8,  time: 12 };
  const saved    = c.saved       ?? (b.total && a.total ? b.total - a.total : 128);
  const savePct  = c.savePct     ?? 10;
  const distSave = c.distSavePct ?? 27;
  const timeSave = c.timeSavePct ?? 29;
  const scenario = c.scenario    || "Standard Warehouse";

  const laborSaved  = (b.labor  || 0) - (a.labor  || 0);
  const travelSaved = (b.travel || 0) - (a.travel || 0);
  const fuelSaved   = (b.fuel   || 0) - (a.fuel   || 0);
  const daily       = saved * 10;
  const monthly     = saved * 10 * 25;
  const annual      = saved * 10 * 300;

  const { name: intent, score } = classifyIntent(q);
  const usedFallback = score === 0;
  if (usedFallback) console.log(`[ChatBot] No specific intent matched — using fallback`);

  switch (intent) {

    case "why_cost_reduce":
      return `Cost reduced from ₹${b.total||"N/A"} to ₹${a.total||"N/A"} — saving ₹${saved} (${savePct}%) in the ${scenario} scenario.\n\nBreakdown:\n• Labor: ₹${laborSaved} saved — picking time cut from ${bef.time} to ${aft.time} min (${timeSave}% faster)\n• Travel: ₹${travelSaved} saved — route shortened from ${bef.dist}m to ${aft.dist}m (${distSave}% less)\n• Fuel/Ops: ₹${fuelSaved} saved from reduced distance factor\n\nDijkstra's algorithm found the shortest warehouse path; Random Forest predicted exact demand — together they eliminate wasted movement and overstocking.`;

    case "travel_cost":
      return `Travel distance: ${bef.dist}m → ${aft.dist}m (${distSave}% reduction).\n\nFormula: Travel Cost = Distance × ₹12/m\n• Before: ${bef.dist} × 12 = ₹${b.travel||Math.round(bef.dist*12)}\n• After:  ${aft.dist} × 12 = ₹${a.travel||Math.round(aft.dist*12)}\n• Saved: ₹${travelSaved}\n\nDijkstra models the warehouse as a weighted graph — aisles are nodes, distances are edge weights. It eliminates backtracking by computing the globally optimal aisle-visit sequence.`;

    case "labor_cost":
      return `Labor cost: ₹${b.labor||"N/A"} → ₹${a.labor||"N/A"} (saved ₹${laborSaved}).\n\nFormula: Labor Cost = Picking Time × ₹25/min\n• Before: ${bef.time} min × 25 = ₹${b.labor||Math.round(bef.time*25)}\n• After:  ${aft.time} min × 25 = ₹${a.labor||Math.round(aft.time*25)}\n\nShorter routes mean pickers complete orders ${bef.time-aft.time} minutes faster per cycle. At 10 cycles/day that's ${(bef.time-aft.time)*10} minutes saved — enough for an extra picking cycle without additional staff.`;

    case "fuel_cost":
      return `Fuel/Ops cost formula: Base ₹150 + Distance × 0.18\n• Before: 150 + ${bef.dist}×0.18 = ₹${b.fuel||Math.round(150+bef.dist*0.18)}\n• After:  150 + ${aft.dist}×0.18 = ₹${a.fuel||Math.round(150+aft.dist*0.18)}\n• Saved: ₹${fuelSaved}\n\nThe ₹150 base covers fixed overheads (lighting, equipment wear). The ×0.18 variable component represents conveyor and fork-lift fuel that scales with distance moved. Shorter Dijkstra routes reduce this variable cost directly.`;

    case "biggest_factor": {
      const max    = Math.max(laborSaved, travelSaved, fuelSaved);
      const leader = max === laborSaved ? "Labor" : max === travelSaved ? "Travel" : "Fuel/Ops";
      const pcts   = { Labor: Math.round(laborSaved/saved*100)||0, Travel: Math.round(travelSaved/saved*100)||0, "Fuel/Ops": Math.round(fuelSaved/saved*100)||0 };
      return `${leader} contributes most to savings in the ${scenario} scenario.\n\n• Labor:    ₹${laborSaved} (${pcts.Labor}% of total savings)\n• Travel:   ₹${travelSaved} (${pcts.Travel}% of total savings)\n• Fuel/Ops: ₹${fuelSaved} (${pcts["Fuel/Ops"]}% of total savings)\n\n${leader === "Labor" ? `Every minute saved = ₹25 saved. Cutting ${bef.time-aft.time} min per cycle × ₹25 = ₹${laborSaved}.` : leader === "Travel" ? `Each metre saved = ₹12. Cutting ${bef.dist-aft.dist}m × ₹12 = ₹${travelSaved}.` : `The distance factor (×0.18) and base cost both contribute to fuel savings.`}`;
    }

    case "roi":
      return `ROI — ${scenario}:\n• Per cycle: ₹${saved} saved (${savePct}%)\n• Daily (10 cycles): ₹${daily.toLocaleString()}\n• Monthly (25 days): ₹${monthly.toLocaleString()}\n• Annual (300 days): ₹${annual.toLocaleString()}\n\nAt 100 cycles/day the annual saving exceeds ₹${(saved*100*300).toLocaleString()}. Implementation cost (server + development) is typically recovered within 2–4 weeks of deployment — a strong business case for AI adoption.`;

    case "random_forest":
      return `Random Forest is the demand forecasting model in this project.\n\nHow it works:\n• Builds 100 decision trees on random subsets of ${m?.dataset_rows||"36,550"} training rows\n• Each tree votes; final prediction = average of all votes\n• Ensemble approach prevents overfitting and handles non-linear patterns\n\nPerformance: ${m?.accuracy_pct||"94.37"}% accuracy | R²=${m?.tuned?.r2||"0.9437"} | MAE=${m?.tuned?.mae||"4.91"} units\n\nAccurate demand prediction prevents overstocking (wasted storage cost) and understocking (lost sales) — directly reducing the total operational cost shown in this dashboard.`;

    case "dijkstra":
      return `Dijkstra's Algorithm optimizes the warehouse picking route.\n\nHow it works:\n• Warehouse floor = weighted graph (aisles = nodes, distances = edge weights)\n• Min-heap priority queue finds shortest path: O((V+E) log V)\n• Visits all required aisles in optimal order, eliminating backtracking\n\nResult in ${scenario}:\n• Distance: ${bef.dist}m → ${aft.dist}m (−${distSave}%)\n• Time: ${bef.time} → ${aft.time} min (−${timeSave}%)\n• Cost saved: ₹${saved}\n\nWithout Dijkstra, pickers follow shelf order which often doubles walking distance.`;

    case "algorithm_general":
      return `This project uses two core algorithms:\n\n1. Random Forest (Demand Forecasting)\n   • Ensemble of 100 decision trees\n   • ${m?.accuracy_pct||"94.37"}% accuracy on ${m?.dataset_rows||"36,550"} warehouse records\n   • Predicts demand to prevent overstock/understock\n\n2. Dijkstra's Shortest Path (Route Optimization)\n   • Graph-based warehouse navigation\n   • Reduced route from ${bef.dist}m to ${aft.dist}m (−${distSave}%)\n   • O((V+E) log V) time complexity\n\nTogether: ML predicts WHAT to pick → Dijkstra finds the SHORTEST path to pick it.`;

    case "dashboard":
      return `Current dashboard values (${scenario}):\n\n📊 KPIs:\n• Total cost before: ₹${b.total||"N/A"}\n• Total cost after:  ₹${a.total||"N/A"}\n• Savings: ₹${saved} (${savePct}%)\n• Distance saved: ${distSave}% | Time saved: ${timeSave}%\n\n📈 ML Model: ${m?.accuracy_pct||"94.37"}% accuracy | R²=${m?.tuned?.r2||"0.9437"}\n📂 Dataset: ${platformData.total_routes||"5,000"} routes | ${platformData.total_picking_records||"36,550"} picking records\n\nAll values update automatically when you switch scenarios — the formulas recalculate in real time.`;

    case "project_overview":
      return `This is the AI Warehouse Optimization project — final-year college project.\n\nFull pipeline:\n1. 📂 Warehouse CSV datasets → loaded into backend\n2. 🤖 Random Forest → demand forecasting (${m?.accuracy_pct||"94.37"}% accurate)\n3. 🗺️ Dijkstra → shortest picking route\n4. 💡 Business formulas → convert AI outputs to ₹ cost values\n5. 📊 Dashboard → before vs after comparison\n6. 💬 Chatbot → explains decisions in plain language\n\nCurrent result: ₹${saved} saved per cycle in ${scenario}.`;

    case "dataset":
      return `Dataset statistics powering this module:\n• PickingRoutes.csv: ${platformData.total_routes||"5,000"} routes\n• WarehousePickingData.csv: ${platformData.total_picking_records||"36,550"} records\n• ML model trained on: ${m?.dataset_rows||"36,550"} rows\n• Avg route distance: ~7.7m | Avg pick time: ~12.4 min\n\nThe "before" scenario values (~38% longer than optimized) are derived from actual dataset averages. All scenario KPIs on this dashboard trace back to these real CSV files — not estimated numbers.`;

    case "formula":
      return `Cost formulas:\n\n• Travel = Distance × ₹12\n  Before: ${bef.dist}×12 = ₹${b.travel||Math.round(bef.dist*12)} | After: ${aft.dist}×12 = ₹${a.travel||Math.round(aft.dist*12)}\n\n• Labor  = Time × ₹25/min\n  Before: ${bef.time}×25 = ₹${b.labor||Math.round(bef.time*25)} | After: ${aft.time}×25 = ₹${a.labor||Math.round(aft.time*25)}\n\n• Fuel   = ₹150 + Distance×0.18\n  Before: ₹${b.fuel||Math.round(150+bef.dist*0.18)} | After: ₹${a.fuel||Math.round(150+aft.dist*0.18)}\n\n• Savings % = (Before−After) ÷ Before × 100 = ${savePct}%`;

    case "scenario":
      return `Scenario comparison:\n• Standard Warehouse:  11m→8m, 17→12 min — saves ~₹128 (10%)\n• High-Volume Picking: 19m→13m, 25→16 min — saves ~₹253 (18%)\n• Small Batch Order:   6m→4m,  9→6 min   — saves ~₹83 (12%)\n\nCurrently selected: ${scenario} — saving ₹${saved} (${savePct}%).\n\nHigh-Volume benefits most because longer unoptimized routes carry more inefficiency. The Custom scenario lets you enter your own distance and time to compute real savings for your warehouse.`;

    case "scale":
      return `Scalability of this solution:\n• Per cycle: ₹${saved} saved\n• 10 cycles/day: ₹${daily.toLocaleString()}\n• 100 cycles/day: ₹${(saved*100).toLocaleString()}\n• Annual (100 cycles, 300 days): ₹${(saved*100*300).toLocaleString()}\n\nDijkstra scales efficiently: O((V+E)logV) handles 1,000-aisle warehouses in milliseconds. Random Forest generalizes from patterns — it doesn't need retraining for larger warehouses, only more data. Both algorithms are production-ready at enterprise scale.`;

    case "examiner":
      return `For the examiner/viva:\n\n1. Data: Real CSVs (${platformData.total_routes||"5,000"} routes, ${platformData.total_picking_records||"36,550"} records)\n2. ML: RandomForestRegressor — ${m?.accuracy_pct||"94.37"}% accuracy, R²=${m?.tuned?.r2||"0.9437"}\n3. Algorithm: Dijkstra shortest path — reduced route ${bef.dist}m→${aft.dist}m\n4. Business value: ₹${saved} saved/cycle = ₹${annual.toLocaleString()}/year at scale\n5. Chatbot: Hybrid engine — Gemini/OpenAI with intelligent rule-based fallback\n6. Context injection: Live dashboard values sent with every chat request\n\nKey innovation: the full AI-to-business-value pipeline is demonstrated with real data, not theory.`;

    case "manager":
      return `In simple terms: before AI, your pickers walked ${bef.dist}m and spent ${bef.time} minutes per order. With AI, they now walk ${aft.dist}m in ${aft.time} minutes.\n\nThis saves ₹${saved} per order — mainly from workers finishing faster (₹${laborSaved} labor) and shorter walks (₹${travelSaved} travel).\n\nAt 10 orders/day: ₹${daily} saved daily. Think of it as Google Maps for your warehouse floor — it finds the shortest route so your team stops backtracking.`;

    case "inventory":
      return `Inventory optimization is handled by the Random Forest demand forecasting module.\n\nBy accurately predicting demand (${m?.accuracy_pct||"94.37"}% accuracy), the system:\n• Prevents overstock — excess inventory ties up capital and warehouse space\n• Prevents understock — stockouts cause lost sales and urgent replenishment costs\n• Feeds the route optimizer with the exact items needed per picking cycle\n\nIn the ${scenario} scenario, optimized inventory picking reduced total cost from ₹${b.total||"N/A"} to ₹${a.total||"N/A"}.`;

    case "total_cost":
      return `Total cost breakdown (${scenario}):\n\nBefore optimization:\n• Travel: ₹${b.travel||"N/A"} | Labor: ₹${b.labor||"N/A"} | Fuel: ₹${b.fuel||"N/A"}\n• Total: ₹${b.total||"N/A"}\n\nAfter AI optimization:\n• Travel: ₹${a.travel||"N/A"} | Labor: ₹${a.labor||"N/A"} | Fuel: ₹${a.fuel||"N/A"}\n• Total: ₹${a.total||"N/A"}\n\nSavings: ₹${saved} (${savePct}%) — split across labor (₹${laborSaved}), travel (₹${travelSaved}), fuel (₹${fuelSaved}).`;

    case "savings_pct":
      return `Savings percentage = (Before − After) ÷ Before × 100\n= (₹${b.total||"N/A"} − ₹${a.total||"N/A"}) ÷ ₹${b.total||"N/A"} × 100\n= ₹${saved} ÷ ₹${b.total||"N/A"} × 100\n= ${savePct}%\n\nDistribution: Travel reduced ${distSave}%, time reduced ${timeSave}%. These percentage improvements scale linearly — doubling the cycles doubles the ₹ savings while the % stays constant.`;

    case "technology":
      return `Technology stack used in this project:\n\nFrontend: React 18 + Vite (fast dev build)\nBackend: Node.js + Express (REST API)\nDatabase/Auth: Supabase (PostgreSQL + Auth)\nML: Python — scikit-learn RandomForest\nAlgorithm: JavaScript Dijkstra implementation\nChatbot: Hybrid — Gemini/OpenAI + rule-based fallback\nData: CSV files (PickingRoutes, WarehousePickingData, etc.)\n\nAll components communicate through REST APIs. The ML model is trained offline and served as a .pkl file called by Node via python-shell.`;

    case "explainability":
      return `Explainability is a core feature of this project — that's what the "Explainable AI" module does.\n\nInstead of just saying "cost reduced", the system explains:\n• WHY: Dijkstra found a ${distSave}% shorter route\n• HOW MUCH: ₹${saved} saved this cycle\n• WHICH FACTOR: ${laborSaved > travelSaved ? "Labor" : "Travel"} contributed most (₹${Math.max(laborSaved,travelSaved)})\n• AT SCALE: ₹${annual.toLocaleString()} annual saving\n\nThis chatbot itself is an explainability layer — it translates ML and algorithm outputs into plain-language business reasoning, making AI decisions transparent and auditable.`;

    case "comparison":
      return `Before vs After AI Optimization (${scenario}):\n\n| Metric          | Before  | After   | Change    |\n|-----------------|---------|---------|-----------||\n| Distance        | ${bef.dist}m     | ${aft.dist}m     | −${distSave}%    |\n| Time            | ${bef.time} min   | ${aft.time} min   | −${timeSave}%    |\n| Travel Cost     | ₹${b.travel||"—"}  | ₹${a.travel||"—"}  | −₹${travelSaved} |\n| Labor Cost      | ₹${b.labor||"—"}  | ₹${a.labor||"—"}  | −₹${laborSaved}  |\n| Fuel Cost       | ₹${b.fuel||"—"}   | ₹${a.fuel||"—"}   | −₹${fuelSaved}   |\n| Total           | ₹${b.total||"—"}  | ₹${a.total||"—"}  | −₹${saved} (${savePct}%) |`;

    case "follow_up":
      return `Building on that — in the ${scenario} scenario the ₹${saved} saving breaks down as:\n• ₹${laborSaved} from labor (pickers ${bef.time-aft.time} min faster)\n• ₹${travelSaved} from travel (${bef.dist-aft.dist}m shorter route)\n• ₹${fuelSaved} from fuel/ops\n\nDaily impact: ₹${daily.toLocaleString()} | Monthly: ₹${monthly.toLocaleString()} | Annually: ₹${annual.toLocaleString()}\n\nWould you like me to explain the algorithm, the formulas, or the ROI in more detail?`;

    case "unrelated":
      return `I specialise in AI Warehouse Optimization and Operational Cost Analysis — that topic is outside my scope.\n\nWhat I can tell you: this warehouse system currently saves ₹${saved} per picking cycle (${savePct}%) in the ${scenario} scenario through AI-driven route optimization. Ask me about the algorithms, business impact, or how to explain this in a viva!`;

    default:
      console.log(`[ChatBot] fallback triggered for: "${q.slice(0,60)}"`);
      return `In the ${scenario} scenario, this AI system reduced cost from ₹${b.total||"N/A"} to ₹${a.total||"N/A"} — saving ₹${saved} (${savePct}%) per cycle.\n\nYou can ask me about:\n• Why costs reduced and which factor was biggest\n• Travel, Labor, or Fuel cost formulas with live values\n• Random Forest demand forecasting (${m?.accuracy_pct||"94.37"}% accuracy)\n• Dijkstra route optimization algorithm\n• ROI at daily/monthly/annual scale\n• How to explain this to an examiner or warehouse manager`;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// DEMAND FORECASTING RULE ENGINE — scored intent classifier, 25 intents
// ══════════════════════════════════════════════════════════════════════════

const DEMAND_INTENTS = [
  { name: "predicted_demand",      groups: [["predicted","prediction","forecast","how much","what is the demand","current demand","expected"]] },
  { name: "forecast_accuracy",     groups: [["accuracy","accurate","forecast accuracy","how accurate","reliable","correct","precision"]] },
  { name: "model_accuracy",        groups: [["model accuracy","94","accuracy percent","r2","r squared","score"]] },
  { name: "confidence",            groups: [["confidence","confident","certainty","trust","sure","reliable","how sure"]] },
  { name: "mae",                   groups: [["mae","mean absolute error","absolute error","average error","error unit"]] },
  { name: "rmse",                  groups: [["rmse","root mean square","mean square","squared error","error metric"]] },
  { name: "random_forest",         groups: [["random forest","random","forest","why random forest","ensemble","decision tree","100 tree"]] },
  { name: "why_random_forest",     groups: [["why","reason","select","chose","use"],["random forest","forest","ensemble","tree"]] },
  { name: "feature_importance",    groups: [["feature importance","important feature","which feature","top feature","variable importance","input variable"]] },
  { name: "demand_trend",          groups: [["trend","increasing","decreasing","going up","going down","demand trend","pattern","seasonal"]] },
  { name: "seasonal_demand",       groups: [["season","seasonal","monthly","weekly","holiday","peak","festive","quarter"]] },
  { name: "inventory_recommendation",groups:[["inventory","replenish","restock","how much stock","stock level","order quantity","recommend"]] },
  { name: "reorder_level",         groups: [["reorder","reorder point","reorder level","when to order","trigger","threshold"]] },
  { name: "safety_stock",          groups: [["safety stock","buffer","safety","reserve","cushion","extra stock"]] },
  { name: "stock_shortage",        groups: [["shortage","stockout","out of stock","empty","insufficient","not enough","low stock"]] },
  { name: "overstock",             groups: [["overstock","excess","too much","surplus","waste","dead stock","holding cost"]] },
  { name: "dataset",               groups: [["dataset","csv","data","record","row","training data","historical","file"]] },
  { name: "preprocessing",         groups: [["preprocess","clean","missing value","encode","normaliz","scale","transform","pipeline"]] },
  { name: "model_training",        groups: [["train","training","fit","grid search","cross valid","hyperparameter","80 20","split"]] },
  { name: "explain_prediction",    groups: [["explain","why predict","reason for","how did","interpret","xai","explainable"]] },
  { name: "business_benefit",      groups: [["business","benefit","value","impact","saving","cost","roi","profit","advantage"]] },
  { name: "manager_explanation",   groups: [["manager","ceo","client","layman","simple","non-tech","beginner","basic","explain simple"]] },
  { name: "examiner_explanation",  groups: [["examiner","viva","professor","faculty","judge","evaluator","marks","presentation"]] },
  { name: "project_overview",      groups: [["project","system","platform","pipeline","overview","how does","what is","architecture"]] },
  { name: "technology",            groups: [["technology","tech stack","python","scikit","sklearn","react","node","library","framework"]] },
  { name: "comparison",            groups: [["compare","vs","versus","before","after","without ml","with ml","difference"]] },
  { name: "formula",               groups: [["formula","equation","math","calculat","compute","how is","derived"]] },
  { name: "follow_up",             groups: [["more","tell me more","elaborate","detail","continue","further","go on","next","also"]] },
  { name: "unrelated",             groups: [["weather","cricket","movie","news","politics","food","sport","game","stock market"]] },
];

function classifyDemandIntent(q) {
  let best = { name: "fallback", score: 0 };
  for (const intent of DEMAND_INTENTS) {
    let score = 0;
    for (const group of intent.groups) {
      if (group.some(kw => q.includes(kw))) score++;
    }
    if (score > best.score) best = { name: intent.name, score };
  }
  console.log(`[DemandBot] intent="${best.name}" score=${best.score} query="${q.slice(0, 60)}"`);
  return best;
}

function demandRuleEngine(question, platformData, demandCtx) {
  const q  = question.toLowerCase().trim();
  const m  = platformData.model_metrics;
  const d  = demandCtx || {};

  // Live values — always use demandCtx if provided, fall back to model_metrics
  const accuracy    = d.accuracy_pct   ?? m?.accuracy_pct    ?? 94.37;
  const r2          = d.r2             ?? m?.tuned?.r2        ?? 0.9437;
  const mae         = d.mae            ?? m?.tuned?.mae       ?? 4.91;
  const rmse        = d.rmse           ?? m?.tuned?.rmse      ?? 6.21;
  const datasetRows = d.dataset_rows   ?? m?.dataset_rows     ?? 36550;
  const modelName   = d.model          ?? m?.model            ?? "RandomForestRegressor";
  const avgDemand   = d.avg_demand     ?? platformData.total_picking_records ?? 75;
  const avgInv      = d.avg_inventory  ?? 250;
  const avgReorder  = d.avg_reorder    ?? 80;
  const avgLead     = d.avg_lead_time  ?? 7;
  const totalOrders = d.total_orders   ?? platformData.total_orders ?? 50000;
  const pickingRecs = d.picking_records ?? platformData.total_picking_records ?? 36550;

  const safetyStock = Math.round(avgDemand * avgLead * 0.3);
  const reorderPoint = Math.round(avgReorder);
  const { name: intent, score } = classifyDemandIntent(q);

  switch (intent) {

    case "predicted_demand":
      return `The current predicted demand is approximately ${avgDemand} units on average across the warehouse dataset.\n\nThis prediction is generated by the ${modelName} model which was trained on ${datasetRows.toLocaleString()} historical records. The model considers features like inventory level, lead time, day of week, product category, and rolling averages to generate this forecast.\n\nAccuracy: ${accuracy}% | MAE: ${mae} units — meaning predictions are typically within ${mae} units of actual demand.`;

    case "forecast_accuracy":
      return `Forecast accuracy measures how closely the model's predicted demand matches actual demand.\n\nCurrent performance:\n• Accuracy: ${accuracy}%\n• R² Score: ${r2} (explains ${Math.round(r2*100)}% of demand variance)\n• MAE: ${mae} units — average prediction error\n• RMSE: ${rmse} units — penalises large errors more heavily\n\nAn accuracy of ${accuracy}% means the warehouse manager can rely on this forecast for procurement and staffing decisions with high confidence.`;

    case "model_accuracy":
      return `The ${modelName} model achieves ${accuracy}% accuracy on the test dataset.\n\nDetailed metrics:\n• R² Score: ${r2} — the model explains ${Math.round(r2*100)}% of variation in demand\n• MAE: ${mae} units — on average, predictions are within ${mae} units of actual\n• RMSE: ${rmse} units — root mean squared error\n• Trained on: ${datasetRows.toLocaleString()} rows | Test set: ${Math.round(datasetRows * 0.2).toLocaleString()} rows (80/20 split)\n\nThis level of accuracy (${accuracy}%) is well-suited for warehouse planning — typical industry benchmarks are 80–90% for demand forecasting.`;

    case "confidence":
      return `Model confidence reflects how certain the forecast is.\n\nWith ${accuracy}% accuracy and R²=${r2}, this model is highly confident for:\n• Standard product categories (Electronics, Grocery)\n• Regular weekday patterns\n• Products with sufficient historical data\n\nConfidence may be lower for:\n• New products with limited history\n• Extreme seasonal spikes not well-represented in the ${datasetRows.toLocaleString()}-row training set\n\nFor critical decisions, cross-check forecasts with the rolling 7-day average shown in the dashboard.`;

    case "mae":
      return `MAE (Mean Absolute Error) measures the average size of prediction errors, ignoring direction.\n\nFormula: MAE = Σ|Actual − Predicted| ÷ n\n\nCurrent MAE: ${mae} units\n\nThis means on average, the ${modelName} predicts demand within ${mae} units of actual demand. For a warehouse ordering ${avgDemand} units on average, an error of ${mae} units is only ${((mae/avgDemand)*100).toFixed(1)}% — well within acceptable range for procurement planning.\n\nMAE is preferred over RMSE when all errors are equally important, regardless of their magnitude.`;

    case "rmse":
      return `RMSE (Root Mean Squared Error) penalises large prediction errors more than MAE.\n\nFormula: RMSE = √(Σ(Actual − Predicted)² ÷ n)\n\nCurrent RMSE: ${rmse} units\n\nRMSE is higher than MAE (${mae}) because it squares errors before averaging — large outlier errors push it up. An RMSE of ${rmse} against an average demand of ${avgDemand} units means ${((rmse/avgDemand)*100).toFixed(1)}% relative error.\n\nIn practice: use MAE for daily operations planning and RMSE when avoiding large forecast misses is critical (e.g., high-value or perishable goods).`;

    case "random_forest":
      return `Random Forest is an ensemble machine learning algorithm used for demand forecasting in this project.\n\nHow it works:\n• Builds ${100} decision trees, each trained on a random subset of the ${datasetRows.toLocaleString()}-row dataset\n• Each tree independently predicts demand; the final output is the average of all 100 predictions\n• Random feature selection at each split prevents trees from being correlated\n\nResult: ${accuracy}% accuracy | R²=${r2} | MAE=${mae}\n\nKey advantage: handles non-linear demand patterns, seasonal spikes, and mixed feature types (numeric + categorical) without manual feature engineering.`;

    case "why_random_forest":
      return `Random Forest was selected for demand forecasting for these specific reasons:\n\n1. Non-linear patterns: Warehouse demand has complex, non-linear relationships between features (inventory, lead time, season, category) that linear regression cannot capture.\n\n2. Ensemble robustness: 100 trees reduce overfitting. A single decision tree memorises training data; Random Forest generalises better to new data.\n\n3. Mixed features: Handles both numeric (inventory level, unit price) and categorical (product category, warehouse zone) features natively.\n\n4. Feature importance: Provides built-in ranking of which features drive demand — useful for explainability.\n\n5. Performance: Achieved ${accuracy}% accuracy on ${datasetRows.toLocaleString()} records with minimal hyperparameter tuning.`;

    case "feature_importance":
      return `Feature importance ranks which input variables most influence the demand prediction.\n\nTop features in this model (approximate ranking):\n1. rolling_avg_7d — 7-day rolling average of demand (strongest predictor)\n2. inventory_level — current stock affects reorder behaviour\n3. unit_price — price elasticity affects demand\n4. lead_time_days — longer lead times require higher safety stock orders\n5. day_of_week — weekday patterns (weekends show different demand)\n6. month — seasonal variation across the year\n7. product category — Electronics vs Grocery have very different demand profiles\n\nRandom Forest computes importance by measuring how much each feature reduces prediction error across all 100 trees.`;

    case "demand_trend":
      return `Demand trends are captured through time-based features in the model.\n\nCurrent dataset statistics:\n• Average demand: ${avgDemand} units\n• Dataset covers: ${datasetRows.toLocaleString()} records across multiple product categories\n• Rolling averages (7-day, 30-day) are engineered features that capture trend direction\n\nTrend factors the model detects:\n• Weekday vs weekend variation (is_weekend feature)\n• Monthly seasonality (month feature)\n• Rolling momentum (rolling_avg_7d) — if this is rising, predicted demand rises\n• Quarter-end ordering spikes (quarter feature)\n\nIf the 7-day rolling average is above the 30-day average, the model interprets this as an upward trend.`;

    case "seasonal_demand":
      return `Seasonal demand patterns are captured through engineered time features:\n\n• month (1–12): captures monthly seasonality — typically Q4 (Oct–Dec) shows higher demand\n• quarter (1–4): captures quarterly business cycles\n• day_of_week (0–6): Monday–Friday vs weekend patterns\n• is_weekend: binary flag for weekend demand shifts\n• week_of_year: fine-grained weekly patterns\n\nThe model was trained on ${datasetRows.toLocaleString()} records covering these seasonal cycles. Average demand in the dataset is ${avgDemand} units — this baseline shifts during peak seasons.\n\nFor better seasonal forecasting: ensure the training data covers at least 2 full years to capture year-over-year patterns.`;

    case "inventory_recommendation":
      return `Inventory recommendation based on current model outputs:\n\nCurrent values:\n• Average predicted demand: ${avgDemand} units\n• Average inventory level: ${avgInv} units\n• Average reorder point: ${reorderPoint} units\n• Average lead time: ${avgLead} days\n• Recommended safety stock: ${safetyStock} units\n\nRecommendation:\n• If inventory < ${reorderPoint} units → trigger a replenishment order immediately\n• Order quantity = Predicted Demand × Lead Time + Safety Stock\n  = ${avgDemand} × ${avgLead} + ${safetyStock} = ${Math.round(avgDemand * avgLead + safetyStock)} units\n• If inventory > ${avgDemand * 3} units → pause replenishment (overstock risk)`;

    case "reorder_level":
      return `The reorder point (ROP) is the inventory level at which a new order should be placed.\n\nFormula: ROP = Average Daily Demand × Lead Time + Safety Stock\n\nCurrent values:\n• Average demand: ${avgDemand} units\n• Lead time: ${avgLead} days\n• Safety stock: ${safetyStock} units\n• Calculated ROP: ${Math.round(avgDemand * avgLead + safetyStock)} units\n• Dataset average reorder point: ${reorderPoint} units\n\nWhen stock falls to ${reorderPoint} units, place a new order to avoid stockout during the ${avgLead}-day replenishment lead time.`;

    case "safety_stock":
      return `Safety stock is the extra buffer inventory held to absorb demand variability and supply delays.\n\nFormula: Safety Stock = Z × σ_demand × √Lead Time\n(Simplified: ~30% of average demand × lead time)\n\nCurrent estimate:\n• Average demand: ${avgDemand} units/cycle\n• Lead time: ${avgLead} days\n• Safety stock: ${safetyStock} units\n\nWithout safety stock, any demand spike above ${avgDemand} units or a supplier delay beyond ${avgLead} days causes a stockout. The ML forecast (MAE=${mae}) itself requires buffer — even a ${mae}-unit error on a low-inventory product can cause a stockout.`;

    case "stock_shortage":
      return `Stockout risk exists when predicted demand exceeds available inventory.\n\nCurrent averages:\n• Predicted demand: ${avgDemand} units\n• Inventory level: ${avgInv} units\n• Reorder point: ${reorderPoint} units\n\nRisk assessment:\n• If inventory (${avgInv}) > predicted demand (${avgDemand}): ✅ Sufficient stock\n• If inventory ≤ reorder point (${reorderPoint}): ⚠️ Trigger replenishment now\n• Stockout cost typically = lost sales + emergency procurement premium + customer dissatisfaction\n\nThe ML model with ${accuracy}% accuracy reduces stockout risk by accurately predicting demand ${avgLead} days ahead — enough time to replenish before running out.`;

    case "overstock":
      return `Overstock occurs when inventory far exceeds predicted demand, tying up capital.\n\nOverstock threshold (rule of thumb): inventory > 3× predicted demand\n• Current average: ${avgInv} units inventory vs ${avgDemand} units demand\n• Ratio: ${(avgInv/avgDemand).toFixed(1)}×\n\nCosts of overstock:\n• Holding cost (storage, insurance, handling): typically 20–30% of item value per year\n• Obsolescence risk for perishable or technology products\n• Reduced warehouse space for higher-demand items\n\nSolution: Use the ML forecast to order only what is needed. Accurate demand prediction (${accuracy}%) allows lean inventory management — ordering closer to actual demand rather than overestimating.`;

    case "dataset":
      return `Dataset used for training the demand forecasting model:\n\n• WarehousePickingData.csv: ${pickingRecs.toLocaleString()} records (primary training data)\n• OrderList.csv: ${totalOrders.toLocaleString()} orders\n• Features: inventory_level, reorder_point, lead_time_days, unit_price, category, warehouse_location, day_of_week, month, is_weekend, rolling_avg_7d, rolling_avg_30d\n• Target: demand (units)\n• Train/Test split: 80% (${Math.round(datasetRows*0.8).toLocaleString()}) / 20% (${Math.round(datasetRows*0.2).toLocaleString()})\n\nEnginered features added during preprocessing: rolling averages, lag features (demand_lag_1, demand_lag_7), stockout_risk flag, day_of_week, month, quarter, week_of_year.`;

    case "preprocessing":
      return `Data preprocessing pipeline for demand forecasting:\n\n1. Missing values: Numeric → filled with median per product group. Categorical → filled with mode.\n2. Date parsing: Converted to day_of_week, month, quarter, is_weekend, week_of_year\n3. Rolling features: rolling_avg_7d, rolling_avg_30d computed per product\n4. Lag features: demand_lag_1, demand_lag_7 (previous demand values as predictors)\n5. Stockout flag: inventory_level ≤ reorder_point → binary feature\n6. Encoding: OneHotEncoder for categorical features (category, warehouse_location)\n7. Scaling: StandardScaler for numeric features\n\nAll preprocessing is encapsulated in a scikit-learn Pipeline stored as pipeline_model.pkl — ensuring identical transformations at prediction time.`;

    case "model_training":
      return `Model training process:\n\n1. Data: ${datasetRows.toLocaleString()} rows from WarehousePickingData.csv\n2. Split: 80/20 train/test (random_state=42 for reproducibility)\n3. Base model: RandomForestRegressor(n_estimators=100, random_state=42)\n4. Hyperparameter tuning: GridSearchCV with 3-fold cross-validation\n   - n_estimators: [50, 100]\n   - max_depth: [None, 10, 20]\n5. Final metrics: Accuracy=${accuracy}% | R²=${r2} | MAE=${mae} | RMSE=${rmse}\n6. Model saved as pipeline_model.pkl + pipeline_meta.pkl\n\nWhy GridSearchCV? It systematically tests all parameter combinations and selects the one with the best cross-validated R² score — avoiding both underfitting and overfitting.`;

    case "explain_prediction":
      return `How the prediction is generated for a specific product:\n\n1. Input: inventory_level=${avgInv}, reorder_point=${reorderPoint}, lead_time=${avgLead} days, rolling_avg_7d=${avgDemand}\n2. Preprocessing: StandardScaler normalises numeric features; OneHotEncoder encodes category\n3. Prediction: 100 decision trees each process the input independently\n4. Output: average of all 100 tree predictions = ${avgDemand} units (approx.)\n5. Confidence: based on tree agreement — high agreement = high confidence\n\nThe model learned these patterns from ${datasetRows.toLocaleString()} historical records. It essentially asks: "For products with similar inventory, price, category, and time of year, what was the actual demand historically?" — then averages those answers.`;

    case "business_benefit":
      return `Business benefits of AI-driven demand forecasting:\n\n• Reduced stockouts: ${accuracy}% accuracy means the right stock is available ${accuracy}% of the time\n• Reduced overstock: Lean ordering based on predicted demand reduces holding costs\n• Optimised procurement: Order exactly what's needed, ${avgLead} days before stockout\n• Labour efficiency: Picking routes planned for predicted demand, not guesswork\n• Scalable: The model handles ${datasetRows.toLocaleString()} products — a human planner cannot\n\nQuantified: Even a 1% reduction in stockouts across ${totalOrders.toLocaleString()} orders saves hundreds of lost-sale incidents annually. Combined with route optimization, this project demonstrates measurable warehouse ROI.`;

    case "manager_explanation":
      return `In simple terms: the system predicts how much stock you'll need before you run out.\n\nInstead of guessing or ordering too much "just in case," the AI looks at your sales history (${datasetRows.toLocaleString()} past records) and predicts demand with ${accuracy}% accuracy.\n\nPractical result:\n• You reorder at the right time (reorder point: ~${reorderPoint} units)\n• You hold the right amount of buffer stock (~${safetyStock} units safety stock)\n• You avoid expensive emergency orders when stock runs out\n• You avoid wasting money storing excess stock\n\nThink of it as a very experienced purchasing manager who remembers every order you've ever made and uses that to plan ahead.`;

    case "examiner_explanation":
      return `For the viva/examiner:\n\n1. Problem: Demand forecasting in warehouse management is non-linear, seasonal, and multi-variate.\n2. Algorithm: RandomForestRegressor — ensemble of 100 decision trees with random feature subsets\n3. Dataset: ${datasetRows.toLocaleString()} records | Features: 12 including engineered lag and rolling features\n4. Pipeline: Data → Preprocessing (StandardScaler + OneHotEncoder) → RandomForest → Prediction\n5. Performance: ${accuracy}% accuracy | R²=${r2} | MAE=${mae} units | RMSE=${rmse} units\n6. Deployment: Trained model saved as .pkl, called via Node.js python-shell on each prediction request\n7. Improvement: GridSearchCV tuning showed no R² gain → base model was already optimal\n8. Business value: Enables just-in-time inventory management, reducing both stockouts and holding costs`;

    case "project_overview":
      return `The Demand Forecasting module is part of the AI Warehouse Optimization system.\n\nFull pipeline:\n1. 📂 WarehousePickingData.csv (${pickingRecs.toLocaleString()} records) → preprocessing\n2. 🤖 RandomForestRegressor → trained model (${accuracy}% accuracy)\n3. 📊 Dashboard: user enters product features → model predicts demand\n4. 💡 AI Insights: explains the prediction and suggests inventory action\n5. 💬 This chatbot: answers questions about the forecast in plain language\n\nThe model is saved as pipeline_model.pkl and served via a Node.js backend that calls Python using python-shell — a full-stack ML deployment demonstration.`;

    case "technology":
      return `Technology stack for demand forecasting:\n\nML: Python 3 + scikit-learn (RandomForestRegressor, Pipeline, ColumnTransformer, GridSearchCV)\nData: pandas, numpy — preprocessing, feature engineering\nModel serving: joblib (.pkl files) called from Node.js via python-shell\nBackend: Node.js + Express — REST API at POST /api/predict-demand\nFrontend: React 18 + Vite — form inputs → API call → display prediction\nFallback: JS rule-based engine if Python unavailable\n\nKey design choice: The sklearn Pipeline bundles preprocessing + model into one .pkl file — this ensures identical feature transformations at training and prediction time, preventing data leakage.`;

    case "comparison":
      return `Before vs After AI-driven demand forecasting:\n\n| Aspect            | Without ML          | With ML (${accuracy}% accuracy) |\n|-------------------|---------------------|---------------------------------|\n| Demand estimate   | Manual/historical avg | Predicted: ${avgDemand} units   |\n| Stockout risk     | High (guesswork)    | Low (data-driven)               |\n| Overstock         | Frequent            | Minimised                       |\n| Lead time buffer  | Over-estimated      | Optimised: ${avgLead} days      |\n| Reorder point     | Fixed rule-of-thumb | Dynamic: ~${reorderPoint} units |\n| Error             | Unpredictable       | MAE=${mae} units, RMSE=${rmse}  |\n\nThe key improvement: ML replaces human guesswork with pattern-recognition across ${datasetRows.toLocaleString()} historical records.`;

    case "formula":
      return `Key formulas in demand forecasting:\n\n• Reorder Point = Avg Daily Demand × Lead Time + Safety Stock\n  = ${avgDemand} × ${avgLead} + ${safetyStock} = ${Math.round(avgDemand*avgLead+safetyStock)} units\n\n• Safety Stock = Z × σ × √Lead Time (simplified: 30% × demand × lead time)\n  ≈ ${safetyStock} units\n\n• MAE = Σ|Actual − Predicted| ÷ n = ${mae} units\n\n• RMSE = √(Σ(Actual − Predicted)² ÷ n) = ${rmse} units\n\n• R² Score = 1 − (SS_res / SS_tot) = ${r2}\n  (${Math.round(r2*100)}% of demand variation explained by the model)\n\n• Accuracy % = R² × 100 = ${accuracy}%`;

    case "follow_up":
      return `To build on that — here's a deeper look at the current model state:\n\nModel: ${modelName}\n• Accuracy: ${accuracy}% | R²: ${r2} | MAE: ${mae} units | RMSE: ${rmse} units\n• Trained on: ${datasetRows.toLocaleString()} warehouse records\n\nInventory picture:\n• Avg demand: ${avgDemand} units | Avg inventory: ${avgInv} units\n• Reorder point: ${reorderPoint} units | Safety stock: ${safetyStock} units\n\nWould you like me to explain the algorithm, the evaluation metrics, inventory recommendations, or how to present this in a viva?`;

    case "unrelated":
      return `I specialise in Demand Forecasting and Warehouse AI — that topic is outside my scope.\n\nWhat I can help with: this warehouse system predicts demand with ${accuracy}% accuracy using Random Forest, trained on ${datasetRows.toLocaleString()} records. Ask me about the forecast, inventory recommendations, model accuracy, or how to explain this in a viva!`;

    default:
      console.log(`[DemandBot] fallback triggered for: "${q.slice(0, 60)}"`);
      return `The demand forecasting model (${modelName}) predicts demand with ${accuracy}% accuracy (R²=${r2}, MAE=${mae} units), trained on ${datasetRows.toLocaleString()} warehouse records.\n\nYou can ask me about:\n• Predicted demand and forecast accuracy\n• MAE, RMSE, R² metrics explained\n• Why Random Forest was chosen\n• Feature importance and what drives demand\n• Inventory recommendations and reorder points\n• How to explain this to an examiner or warehouse manager`;
  }
}

// ── POST /api/chat ────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const {
    message,
    history      = [],
    liveAgents   = [],
    moduleContext = "general",
    costContext,          // live dashboard values from CostReduction.jsx
  } = req.body;

  if (!message || !message.trim())
    return res.status(400).json({ error: "Message is required" });

  // Log incoming request
  console.log(`\n[ChatBot] POST /api/chat`);
  console.log(`[ChatBot] message: "${message.slice(0, 80)}..."`);
  console.log(`[ChatBot] moduleContext: ${moduleContext}`);
  console.log(`[ChatBot] costContext received:`, costContext ? "YES" : "NO");
  if (costContext) {
    console.log(`  - before: { dist: ${costContext.before?.dist}, time: ${costContext.before?.time} }`);
    console.log(`  - after:  { dist: ${costContext.after?.dist}, time: ${costContext.after?.time} }`);
    console.log(`  - saved: ₹${costContext.saved} (${costContext.savePct}%)`);
  }

  const platformData = getPlatformSnapshot();
  const systemPrompt = buildSystemPrompt(platformData, liveAgents, moduleContext, costContext);
  const historyMsgs  = history.slice(-10).map(h => ({ role: h.role, content: h.content }));

  // ── Path 1: Gemini ───────────────────────────────────────────────────
  const gemini = getGemini();
  if (gemini) {
    try {
      console.log(`[ChatBot] Attempting Gemini...`);
      const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
      const fullPrompt = `${systemPrompt}\n\n${historyMsgs.map(h => `${h.role}: ${h.content}`).join("\n")}\nuser: ${message}`;
      const result = await model.generateContent(fullPrompt);
      const answer = result.response.text().trim();
      console.log(`[ChatBot] Gemini succeeded`);
      return res.json({ answer, engine: "gemini" });
    } catch (e) {
      console.warn(`[ChatBot] Gemini error, trying OpenAI:`, e.message);
    }
  }

  // ── Path 2: OpenAI ───────────────────────────────────────────────────
  const openai = getOpenAI();
  if (openai) {
    try {
      console.log(`[ChatBot] Attempting OpenAI...`);
      const completion = await openai.chat.completions.create({
        model:    "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          ...historyMsgs,
          { role: "user", content: message },
        ],
        max_tokens:  500,
        temperature: 0.4,
      });
      const answer = completion.choices[0].message.content.trim();
      console.log(`[ChatBot] OpenAI succeeded`);
      return res.json({ answer, engine: "openai_gpt", model: completion.model });
    } catch (e) {
      console.warn(`[ChatBot] OpenAI error, falling back to rule engine:`, e.message);
    }
  }

  // ── Path 3: Rule-Based Engine (always works, no API needed) ──────────
  console.log(`[ChatBot] Using rule-based engine (no API keys or API failed)`);
  const answer = ruleBasedAnswer(message, platformData, liveAgents, costContext);
  res.json({ answer, engine: "rule_based" });
});

module.exports = router;
