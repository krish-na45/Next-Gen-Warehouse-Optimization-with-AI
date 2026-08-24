// agentAuth.js — Delivery Agent Login + Company Dashboard APIs
// Data that must survive server restarts is persisted to JSON files in /data/

const express = require("express");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const fs      = require("fs");
const path    = require("path");
const router  = express.Router();

// ── JSON persistence helpers ──────────────────────────────────────────────
const DATA_DIR   = path.join(__dirname, "../data");
const STATUS_FILE = path.join(DATA_DIR, "agent_statuses.json");
const LOCATION_FILE = path.join(DATA_DIR, "agent_locations.json");
const PROOF_FILE  = path.join(DATA_DIR, "proof_of_delivery.json");

function readJSON(file, fallback = {}) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (_) {}
  return fallback;
}

function writeJSON(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8"); } catch (_) {}
}

// ── In-memory agent store (seeded once — credentials never change) ────────
const agents = [];

// ── Persistent stores — loaded from JSON files on startup ────────────────
let agentStatuses  = readJSON(STATUS_FILE,   {});
let agentLocations = readJSON(LOCATION_FILE, {});
let proofStore     = readJSON(PROOF_FILE,    {});

async function seedAgents() {
  if (agents.length > 0) return;
  const seed = [
    { id: "agent_001", name: "Amit Kumar",   email: "amit@warehouse.com",  phone: "+91 98765 43210", role: "delivery_agent", password: "agent123" },
    { id: "agent_002", name: "Rahul Sharma", email: "rahul@warehouse.com", phone: "+91 87654 32109", role: "delivery_agent", password: "agent123" },
    { id: "agent_003", name: "Neha Patel",   email: "neha@warehouse.com",  phone: "+91 76543 21098", role: "delivery_agent", password: "agent123" },
  ];

  // Default locations if not persisted yet
  const defaultLocations = {
    agent_001: { lat: 21.1458, lng: 79.0882 },
    agent_002: { lat: 21.1,    lng: 78.98   },
    agent_003: { lat: 21.18,   lng: 79.12   },
  };

  for (const a of seed) {
    const hashed = await bcrypt.hash(a.password, 10);
    agents.push({ ...a, password: hashed });
    if (!agentStatuses[a.id])  agentStatuses[a.id]  = "Not Started";
    if (!agentLocations[a.id]) agentLocations[a.id] = defaultLocations[a.id];
  }

  // Save defaults to file so first run persists immediately
  writeJSON(STATUS_FILE,   agentStatuses);
  writeJSON(LOCATION_FILE, agentLocations);

  console.log("✅  Agent accounts seeded (3 delivery agents ready)");
  console.log("   - amit@warehouse.com  / agent123");
  console.log("   - rahul@warehouse.com / agent123");
  console.log("   - neha@warehouse.com  / agent123");
}
(async () => { await seedAgents(); })();

// GET /api/agent/me — verify token and return agent profile
router.get("/me", (req, res) => {
  const header = req.headers["authorization"] || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const secret = process.env.AGENT_JWT_SECRET || "agent_secret_key";
    const decoded = jwt.verify(token, secret);
    
    // Verify role is delivery_agent
    if (decoded.role !== "delivery_agent") {
      return res.status(403).json({ error: "User is not a delivery agent" });
    }

    const agent = agents.find((a) => a.id === decoded.id);
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    res.json({ 
      agent: { 
        id: agent.id, 
        name: agent.name, 
        email: agent.email, 
        phone: agent.phone,
        role: agent.role 
      } 
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

// POST /api/agent/login — email + password → JWT with role verification
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Find agent by email (case-insensitive)
  const agent = agents.find((a) => a.email.toLowerCase() === email.toLowerCase().trim());
  
  if (!agent) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Verify password
  const valid = await bcrypt.compare(password, agent.password);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Verify role is delivery_agent
  if (agent.role !== "delivery_agent") {
    return res.status(403).json({ error: "User role is not authorized for delivery operations. Please contact support." });
  }

  // Generate JWT token with role information
  const token = jwt.sign(
    { 
      id: agent.id, 
      name: agent.name, 
      email: agent.email, 
      role: agent.role 
    },
    process.env.AGENT_JWT_SECRET || "agent_secret_key",
    { expiresIn: "24h" }
  );

  // Return token and agent profile
  res.json({
    token,
    agent: { 
      id: agent.id, 
      name: agent.name, 
      email: agent.email, 
      phone: agent.phone,
      role: agent.role 
    },
  });
});

// GET /api/agent/list — list all agents (no passwords)
router.get("/list", (_req, res) => {
  res.json(agents.map(({ id, name, email, phone, role }) => ({ id, name, email, phone, role })));
});

// GET /api/agent/verify-role/:email — verify if user is a delivery_agent
router.get("/verify-role/:email", (req, res) => {
  const { email } = req.params;
  const agent = agents.find((a) => a.email.toLowerCase() === email.toLowerCase().trim());
  
  if (!agent) {
    return res.status(404).json({ error: "User not found" });
  }
  
  res.json({
    email: agent.email,
    role: agent.role,
    isDeliveryAgent: agent.role === "delivery_agent"
  });
});

// GET /api/agent/status/:id — get saved delivery status for an agent
router.get("/status/:id", (req, res) => {
  const { id } = req.params;
  const status = agentStatuses[id] || "Not Started";
  res.json({ agent_id: id, status });
});

// POST /api/agent/status — save delivery status (persisted to JSON)
router.post("/status", (req, res) => {
  const { agent_id, status } = req.body;
  const valid = ["Not Started", "In Progress", "Delivered"];
  if (!agent_id || !status)        return res.status(400).json({ error: "agent_id and status are required" });
  if (!valid.includes(status))     return res.status(400).json({ error: `status must be one of: ${valid.join(", ")}` });

  agentStatuses[agent_id] = status;
  writeJSON(STATUS_FILE, agentStatuses);          // persist immediately
  res.json({ agent_id, status, saved: true });
});

// ── Company Dashboard APIs ────────────────────────────────────────────────

// Order assignments — mirrors AgentDashboard.jsx ASSIGNMENTS
const ORDER_ASSIGNMENTS = {
  agent_001: {
    orderId: "ORD-2024-001", item: "Industrial Conveyor Belt", quantity: 2, priority: "High",
    warehouse: { name: "Warehouse A – Nagpur Central", address: "Plot 12, Industrial Estate, Nagpur" },
    customer:  { name: "Vikram Industries", phone: "+91 99887 76655", address: "Plot 45, MIDC, Butibori, Nagpur" },
    route: "Nagpur Central → Ring Road → Butibori MIDC", distance: "18 km",
    warehouseLat: 21.1458, warehouseLng: 79.0882,
    customerLat:  21.0,    customerLng:  79.05,
  },
  agent_002: {
    orderId: "ORD-2024-002", item: "Electronic Control Panel", quantity: 1, priority: "Critical",
    warehouse: { name: "Warehouse B – Hingna Road", address: "Shed 7, Hingna Industrial Zone, Nagpur" },
    customer:  { name: "Sunrise Electronics", phone: "+91 88776 65544", address: "12, Sadar, Nagpur" },
    route: "Hingna Road → Wardha Road → Sadar", distance: "11 km",
    warehouseLat: 21.1,  warehouseLng: 78.98,
    customerLat:  21.15, customerLng:  79.09,
  },
  agent_003: {
    orderId: "ORD-2024-003", item: "Grocery Bundle Pack", quantity: 50, priority: "Normal",
    warehouse: { name: "Warehouse C – Kamptee Road", address: "Unit 3, Kamptee Logistics Park, Nagpur" },
    customer:  { name: "Fresh Mart Store", phone: "+91 77665 54433", address: "88, Dharampeth, Nagpur" },
    route: "Kamptee Road → Amravati Road → Dharampeth", distance: "9 km",
    warehouseLat: 21.18, warehouseLng: 79.12,
    customerLat:  21.13, customerLng:  79.07,
  },
};

// In-memory location store — updated by agent GPS broadcast (localStorage fallback in frontend)
// NOTE: now loaded from LOCATION_FILE on startup — see top of file
// In-memory proof store — NOTE: now loaded from PROOF_FILE on startup


// ETA map based on status
function getETA(status) {
  return status === "Not Started" ? "25 min" : status === "In Progress" ? "18 min" : "Done";
}

// Progress % based on status
function getProgress(status) {
  return status === "Not Started" ? 0 : status === "In Progress" ? 65 : 100;
}

// AI recommendations per status
function getAIInsight(agentId, status, order) {
  if (status === "Not Started") return {
    traffic: "Light", route: order?.route || "Optimal route selected",
    timeSaved: "~6 min", fuelSaved: "~0.3 L", confidence: "94%",
    note: `Light traffic detected. Good conditions to start delivery of ${order?.item}.`,
  };
  if (status === "In Progress") return {
    traffic: "Moderate", route: "Wardha Road (alternate suggested)",
    timeSaved: "~4 min", fuelSaved: "~0.2 L", confidence: "91%",
    note: `Moderate traffic near NH44. Alternate route saves ~4 min. On schedule.`,
  };
  return {
    traffic: "N/A", route: order?.route || "—",
    timeSaved: "—", fuelSaved: "0.3 L saved", confidence: "—",
    note: `Delivery completed successfully. Order ${order?.orderId} closed.`,
  };
}

// GET /api/company/dashboard — summary stats + all agents with live status
router.get("/company/dashboard", (req, res) => {
  const all = agents.map(({ id, name, email, phone }) => {
    const status   = agentStatuses[id] || "Not Started";
    const order    = ORDER_ASSIGNMENTS[id];
    const location = agentLocations[id] || { lat: 21.145, lng: 79.08 };
    return {
      id, name, email, phone, status,
      orderId:   order?.orderId || "—",
      item:      order?.item || "—",
      priority:  order?.priority || "Normal",
      route:     order?.route || "—",
      distance:  order?.distance || "—",
      eta:       getETA(status),
      progress:  getProgress(status),
      lat:       location.lat,
      lng:       location.lng,
    };
  });

  res.json({
    agents:     all,
    stats: {
      total:     all.length,
      active:    all.filter(a => a.status === "In Progress").length,
      completed: all.filter(a => a.status === "Delivered").length,
      pending:   all.filter(a => a.status === "Not Started").length,
    },
    lastUpdated: new Date().toISOString(),
  });
});

// GET /api/company/agents — all agents with live status
router.get("/company/agents", (req, res) => {
  const all = agents.map(({ id, name, phone }) => ({
    id, name, phone,
    status:   agentStatuses[id] || "Not Started",
    eta:      getETA(agentStatuses[id] || "Not Started"),
    progress: getProgress(agentStatuses[id] || "Not Started"),
    location: agentLocations[id] || { lat: 21.145, lng: 79.08 },
    order:    ORDER_ASSIGNMENTS[id] || null,
  }));
  res.json(all);
});

// GET /api/company/live-locations — current GPS coords of all agents
router.get("/company/live-locations", (req, res) => {
  const locs = agents.map(({ id, name }) => ({
    id, name,
    status: agentStatuses[id] || "Not Started",
    ...agentLocations[id] || { lat: 21.145, lng: 79.08 },
  }));
  res.json(locs);
});

// POST /api/company/live-locations — agent pushes their GPS coords (persisted)
router.post("/company/live-locations", (req, res) => {
  const { agent_id, lat, lng } = req.body;
  if (!agent_id || lat == null || lng == null)
    return res.status(400).json({ error: "agent_id, lat, lng required" });
  agentLocations[agent_id] = { lat, lng };
  writeJSON(LOCATION_FILE, agentLocations);       // persist immediately
  res.json({ saved: true });
});

// GET /api/company/order/:id — full order details for one agent
router.get("/company/order/:id", (req, res) => {
  const { id } = req.params;
  const order  = ORDER_ASSIGNMENTS[id];
  if (!order) return res.status(404).json({ error: "Order not found for agent " + id });

  const status = agentStatuses[id] || "Not Started";
  const agent  = agents.find(a => a.id === id);
  const proof  = proofStore[order.orderId] || null;

  res.json({
    agent:    agent ? { id: agent.id, name: agent.name, phone: agent.phone } : null,
    order,
    status,
    eta:      getETA(status),
    progress: getProgress(status),
    location: agentLocations[id] || { lat: order.warehouseLat, lng: order.warehouseLng },
    ai:       getAIInsight(id, status, order),
    proof,
  });
});

// GET /api/company/proof/:orderId — get proof of delivery for an order
router.get("/company/proof/:orderId", (req, res) => {
  const proof = proofStore[req.params.orderId];
  if (!proof) return res.status(404).json({ error: "No proof submitted yet" });
  res.json(proof);
});

// POST /api/company/proof/:orderId — save proof of delivery (persisted)
router.post("/company/proof/:orderId", (req, res) => {
  const { notes, photo, signature, agentId } = req.body;
  if (!notes) return res.status(400).json({ error: "notes required" });
  proofStore[req.params.orderId] = {
    orderId: req.params.orderId, agentId, notes, photo, signature,
    timestamp: new Date().toISOString(),
  };
  writeJSON(PROOF_FILE, proofStore);              // persist immediately
  res.json({ saved: true, timestamp: proofStore[req.params.orderId].timestamp });
});

// GET /api/company/ai-insights/:id — AI recommendations for one agent
router.get("/company/ai-insights/:id", (req, res) => {
  const { id } = req.params;
  const status = agentStatuses[id] || "Not Started";
  const order  = ORDER_ASSIGNMENTS[id];
  if (!order) return res.status(404).json({ error: "No order found for agent " + id });
  res.json(getAIInsight(id, status, order));
});

// ── Public Order Tracking APIs (no auth required) ────────────────────────

// Delivery history timestamps — generated once per order based on status
function getTimeline(orderId, status, order) {
  const base = [
    { stage: "Order Confirmed", time: order?.packedAt !== "—" ? "09:00 AM" : "—", done: true },
    { stage: "Packed",          time: order?.packedAt || "—",
      done: status === "In Progress" || status === "Delivered" },
    { stage: "Picked Up",       time: order?.dispatchedAt || "—",
      done: status === "In Progress" || status === "Delivered" },
    { stage: "On The Way",      time: status === "In Progress" ? "Now" : status === "Delivered" ? order?.dispatchedAt || "—" : "—",
      active: status === "In Progress",
      done:   status === "Delivered" },
    { stage: "Delivered",       time: status === "Delivered" ? "Delivered ✓" : "—",
      done: status === "Delivered" },
  ];
  return base;
}

// AI explanation for public tracker
function getPublicAI(status, order) {
  const dist     = order?.distance || "—";
  const item     = order?.item     || "—";
  const priority = order?.priority || "Normal";

  if (status === "Not Started") return {
    eta: "~25 min",
    confidence: "88%",
    traffic: "Light",
    alert: null,
    reasons: [
      `Order (${item}) is confirmed and awaiting dispatch.`,
      `Route (${order?.route || "—"}) is ${dist} — optimized by Dijkstra's Algorithm.`,
      `Traffic conditions are currently light.`,
      `Priority level: ${priority} — standard dispatch queue.`,
      "Weather conditions are favorable for delivery.",
    ],
  };

  if (status === "In Progress") return {
    eta: "~18 min",
    confidence: "94%",
    traffic: "Moderate",
    alert: "Moderate traffic near NH44. Alternate route active. Expected on time.",
    reasons: [
      `Order has been picked up and is ${dist} from destination.`,
      `Driver is actively on route: ${order?.route || "—"}.`,
      `Current traffic is moderate — alternate route via Wardha Road active.`,
      "Route was optimized using Dijkstra's Algorithm — 27% shorter than standard path.",
      `Estimated arrival: ~18 minutes based on current speed and distance.`,
      `Prediction confidence: 94% based on historical data for this route.`,
    ],
  };

  return {
    eta: "Delivered",
    confidence: "100%",
    traffic: "N/A",
    alert: null,
    reasons: [
      `Order (${item}) has been successfully delivered.`,
      `Final route: ${order?.route || "—"} — total distance ${dist}.`,
      "Delivery completed on schedule.",
      "Proof of delivery submitted by the agent.",
    ],
  };
}

// GET /api/public/order/:orderId — full order data (no auth)
router.get("/public/order/:orderId", (req, res) => {
  const { orderId } = req.params;

  // Find which agent has this order
  const agentId = Object.keys(ORDER_ASSIGNMENTS).find(
    id => ORDER_ASSIGNMENTS[id].orderId === orderId.toUpperCase()
  );

  if (!agentId) return res.status(404).json({ error: "No order found with this ID." });

  const order    = ORDER_ASSIGNMENTS[agentId];
  const status   = agentStatuses[agentId]  || "Not Started";
  const location = agentLocations[agentId] || { lat: order.warehouseLat, lng: order.warehouseLng };
  const agent    = agents.find(a => a.id === agentId);
  const proof    = proofStore[orderId]     || null;
  const ai       = getPublicAI(status, order);
  const timeline = getTimeline(orderId, status, order);

  res.json({
    orderId,
    status,
    item:        order.item,
    quantity:    order.quantity,
    priority:    order.priority,
    cost:        order.priority === "Critical" ? "₹1,800" : order.priority === "High" ? "₹4,250" : "₹920",
    warehouse:   order.warehouse.name,
    warehouseAddr: order.warehouse.address,
    destination: order.customer.address,
    customer:    order.customer.name,
    route:       order.route,
    distance:    order.distance,
    agent: agent ? {
      name:    agent.name,
      phone:   agent.phone,
      id:      agent.id,
      vehicle: agentId === "agent_001" ? "MH-31-AB-1234"
             : agentId === "agent_002" ? "MH-31-CD-5678" : "MH-31-EF-9012",
      location,
    } : null,
    eta:       ai.eta,
    ai,
    timeline,
    proof,
    lastUpdated: new Date().toISOString(),
  });
});

// GET /api/public/order/:orderId/status — lightweight status-only poll
router.get("/public/order/:orderId/status", (req, res) => {
  const { orderId } = req.params;
  const agentId = Object.keys(ORDER_ASSIGNMENTS).find(
    id => ORDER_ASSIGNMENTS[id].orderId === orderId.toUpperCase()
  );
  if (!agentId) return res.status(404).json({ error: "Order not found." });
  res.json({
    orderId,
    status:      agentStatuses[agentId] || "Not Started",
    eta:         getETA(agentStatuses[agentId] || "Not Started"),
    lastUpdated: new Date().toISOString(),
  });
});

module.exports = router;
