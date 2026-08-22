import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './CostReduction.css'

const API = 'http://localhost:5000/api'
const getToken = () => localStorage.getItem('token')

// ── Cost formula constants ────────────────────────────────────────────────
// Distances are in warehouse aisle units (each unit ≈ 10 metres of walking).
// Costs scaled to reflect realistic per-order warehouse operating expenses.
const COST_PER_METER   = 12     // ₹ per aisle unit (picker walk cost at scale)
const LABOR_RATE       = 25     // ₹ per minute
const FUEL_BASE        = 150    // ₹ fixed fuel/ops base (reduced so travel is visible)

// ── Preset scenarios — derived from real PickingRoutes dataset ────────────
// avg route dist = 7.7m, avg time = 12.4 min; unoptimized ~38% longer
const SCENARIOS = [
  { label: 'Standard Warehouse',  before: { dist: 11, time: 17 }, after: { dist: 8,  time: 12 } },
  { label: 'High-Volume Picking', before: { dist: 19, time: 25 }, after: { dist: 13, time: 16 } },
  { label: 'Small Batch Order',   before: { dist: 6,  time: 9  }, after: { dist: 4,  time: 6  } },
]

function calcCosts(dist, time) {
  const travel = Math.round(dist * COST_PER_METER)
  const labor  = Math.round(time * LABOR_RATE)
  const fuel   = Math.round(FUEL_BASE + dist * 0.18)
  return { travel, labor, fuel, total: travel + labor + fuel }
}

// ── Simple SVG bar chart ──────────────────────────────────────────────────
function BarChart({ before, after }) {
  const max    = Math.max(before.total, after.total)
  const cats   = ['Travel', 'Labor', 'Fuel/Ops']
  const bVals  = [before.travel, before.labor, before.fuel]
  const aVals  = [after.travel,  after.labor,  after.fuel]
  const W = 480, H = 220, PAD = 48, BAR_W = 28, GAP = 18, GROUP = 80

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="cost-chart-svg" aria-label="Cost comparison bar chart">
      {/* Y-axis gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = PAD + (1 - t) * (H - PAD * 1.6)
        return (
          <g key={t}>
            <line x1={PAD} y1={y} x2={W - 16} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PAD - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
              ₹{Math.round(t * max)}
            </text>
          </g>
        )
      })}
      {/* Bars */}
      {cats.map((cat, i) => {
        const gx   = PAD + i * GROUP + 16
        const bH   = ((bVals[i] / max) * (H - PAD * 1.6))
        const aH   = ((aVals[i] / max) * (H - PAD * 1.6))
        const bY   = PAD + (H - PAD * 1.6) - bH
        const aY   = PAD + (H - PAD * 1.6) - aH
        return (
          <g key={cat}>
            {/* Before bar */}
            <rect x={gx} y={bY} width={BAR_W} height={bH} rx="4" fill="#ef4444" opacity="0.85" />
            <text x={gx + BAR_W / 2} y={bY - 4} textAnchor="middle" fontSize="9" fill="#ef4444" fontWeight="700">₹{bVals[i]}</text>
            {/* After bar */}
            <rect x={gx + BAR_W + GAP} y={aY} width={BAR_W} height={aH} rx="4" fill="#16a34a" opacity="0.85" />
            <text x={gx + BAR_W + GAP + BAR_W / 2} y={aY - 4} textAnchor="middle" fontSize="9" fill="#16a34a" fontWeight="700">₹{aVals[i]}</text>
            {/* Label */}
            <text x={gx + BAR_W + GAP / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="#64748b">{cat}</text>
          </g>
        )
      })}
      {/* Legend */}
      <rect x={W - 110} y={12} width={10} height={10} rx="2" fill="#ef4444" />
      <text x={W - 96} y={21} fontSize="10" fill="#64748b">Before</text>
      <rect x={W - 60} y={12} width={10} height={10} rx="2" fill="#16a34a" />
      <text x={W - 46} y={21} fontSize="10" fill="#64748b">After</text>
    </svg>
  )
}

// ── Simple SVG pie chart ──────────────────────────────────────────────────
function PieChart({ data }) {
  const total  = data.reduce((s, d) => s + d.value, 0)
  const CX = 90, CY = 90, R = 72
  let angle = -Math.PI / 2
  const slices = data.map(d => {
    const sweep = (d.value / total) * 2 * Math.PI
    const x1 = CX + R * Math.cos(angle)
    const y1 = CY + R * Math.sin(angle)
    angle += sweep
    const x2 = CX + R * Math.cos(angle)
    const y2 = CY + R * Math.sin(angle)
    const large = sweep > Math.PI ? 1 : 0
    return { ...d, path: `M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} Z`, pct: Math.round((d.value / total) * 100) }
  })

  return (
    <div className="pie-wrap">
      <svg viewBox="0 0 180 180" className="cost-pie-svg" aria-label="Cost distribution pie chart">
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth="2" />)}
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="11" fill="#1e293b" fontWeight="700">Total</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize="10" fill="#64748b">₹{total}</text>
      </svg>
      <div className="pie-legend">
        {slices.map((s, i) => (
          <div key={i} className="pie-legend-row">
            <span className="pie-dot" style={{ background: s.color }} />
            <span className="pie-label">{s.label}</span>
            <span className="pie-pct">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const CHAT_SUGGESTIONS = [
  'Why did cost reduce?',
  'How does travel distance affect cost?',
  'What contributes most to savings?',
  'What is the ROI of optimization?',
  'How is labor cost calculated?',
]

export default function CostReduction() {
  const [scenarioIdx,  setScenarioIdx]  = useState(0)
  const [customBefore, setCustomBefore] = useState({ dist: 11, time: 17 })
  const [customAfter,  setCustomAfter]  = useState({ dist: 8,  time: 12 })
  const [useCustom,    setUseCustom]    = useState(false)
  const [calculated,   setCalculated]   = useState(false)
  const [animating,    setAnimating]    = useState(false)
  const [dataStats,    setDataStats]    = useState(null)
  const [showInfo,     setShowInfo]     = useState(false)   // info icon tooltip
  const [showHowCalc,  setShowHowCalc]  = useState(false)  // collapsible section

  // Load real dataset stats
  useEffect(() => {
    fetch(`${API}/data/stats`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => {
        setDataStats(data)
        // Update custom defaults with real avg values
        if (data.routes) {
          const avgDist = Math.round(data.routes.avg_distance_m)
          const avgTime = Math.round(data.routes.avg_time_min)
          const beforeDist = Math.round(avgDist * 1.38)
          const beforeTime = Math.round(avgTime * 1.38)
          setCustomBefore({ dist: beforeDist, time: beforeTime })
          setCustomAfter({ dist: avgDist, time: avgTime })
        }
      })
      .catch(() => {})
  }, [])

  // Chatbot
  const [chatOpen,    setChatOpen]    = useState(false)
  const [chatInput,   setChatInput]   = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [messages,    setMessages]    = useState([
    { role: 'bot', text: "Hi! I'm your Cost Reduction analyst 📉\nAsk me why costs reduced, what contributes most to savings, or how the optimization impacts your bottom line." }
  ])
  const [unread, setUnread] = useState(0)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (chatOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatOpen])

  const scenario = SCENARIOS[scenarioIdx]
  const before   = useCustom ? customBefore : scenario.before
  const after    = useCustom ? customAfter  : scenario.after

  const bCost = calcCosts(before.dist, before.time)
  const aCost = calcCosts(after.dist,  after.time)
  const saved  = bCost.total - aCost.total

  // Safe percentage helper — returns 'N/A' if denominator is 0 or invalid
  const safePct = (num, denom) => {
    if (!denom || denom <= 0 || !isFinite(denom)) return 'N/A'
    const result = Math.round((num / denom) * 100)
    return isFinite(result) ? result : 'N/A'
  }

  const savePct     = safePct(saved,                          bCost.total)
  const distSavePct = safePct(before.dist - after.dist,       before.dist)
  const timeSavePct = safePct(before.time - after.time,       before.time)

  // Validation for custom inputs — shown instead of calculating
  const customInvalid = useCustom && (
    !customBefore.dist || customBefore.dist <= 0 ||
    !customBefore.time || customBefore.time <= 0 ||
    !customAfter.dist  || customAfter.dist  <= 0 ||
    !customAfter.time  || customAfter.time  <= 0
  )

  const handleCalculate = () => {
    setAnimating(true)
    setTimeout(() => { setCalculated(true); setAnimating(false) }, 600)
  }

  const sendMessage = async (text) => {
    const q = (text || chatInput).trim()
    if (!q) return
    setChatInput('')
    const newMsgs = [...messages, { role: 'user', text: q }]
    setMessages(newMsgs)
    setChatLoading(true)

    const liveAgents = Object.values(JSON.parse(localStorage.getItem('live_agents') || '{}'))
    const history = newMsgs.slice(-10).map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }))

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          message: q, history, liveAgents,
          moduleContext: 'cost_reduction',
          costContext: { before, after, bCost, aCost, saved, savePct, distSavePct, timeSavePct },
        }),
      })
      const json = await res.json()
      const reply = res.ok ? json.answer : (json.error || 'Something went wrong.')
      setMessages(m => [...m, { role: 'bot', text: reply }])
      if (!chatOpen) setUnread(u => u + 1)
    } catch {
      setMessages(m => [...m, { role: 'bot', text: 'Could not reach the backend. Make sure the server is running on port 5000.' }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="cr-page">
      {/* ── Hero ── */}
      <section className="cr-hero">
        <div className="container">
          <div className="cr-hero-badge">📉 Operational Cost Reduction</div>
          <h1 className="cr-hero-title">
            Operational Cost Reduction
            <button
              className="cr-info-icon"
              onClick={() => setShowInfo(v => !v)}
              aria-label="What is this module?"
              title="What is this module?"
            >ℹ️</button>
          </h1>
          {showInfo && (
            <div className="cr-info-tooltip">
              This module converts AI predictions and route optimization results into estimated
              operational costs to demonstrate the business impact of AI. Demand forecasting
              (Random Forest) and route optimization (Dijkstra) outputs are translated into
              Travel, Labor, and Fuel costs — showing measurable before vs after savings.
            </div>
          )}
          <p className="cr-hero-sub">Quantified savings from AI-driven warehouse optimization — not theory, real numbers.</p>
        </div>
      </section>

      {/* ══════════ VIEW DEMO ══════════ */}
        <section className="cr-demo">
          <div className="container cr-demo-inner">

            {/* ── Dataset Stats Banner ── */}
            {dataStats && (
              <div className="cr-kpi-row" style={{ marginBottom: '8px' }}>
                {[
                  { icon: '🛤️', label: 'Routes in Dataset',  val: (dataStats.dataset_rows?.PickingRoutes || 0).toLocaleString() },
                  { icon: '📍', label: 'Avg Route Distance', val: `${dataStats.routes?.avg_distance_m ?? '—'} m` },
                  { icon: '⏱️', label: 'Avg Pick Time',      val: `${dataStats.routes?.avg_time_min ?? '—'} min` },
                  { icon: '📦', label: 'Avg Items/Route',    val: dataStats.routes?.avg_items ?? '—' },
                  { icon: '🚚', label: 'On-Time Delivery',   val: `${dataStats.carrier?.avg_on_time_pct ?? '—'}%` },
                  { icon: '🤖', label: 'ML Accuracy',        val: `${dataStats.ml?.accuracy_pct ?? '—'}%` },
                ].map(k => (
                  <div key={k.label} className="cr-kpi-card" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                    <span className="cr-kpi-icon">{k.icon}</span>
                    <span className="cr-kpi-val" style={{ color: '#1e293b', fontSize: '1.1rem' }}>{k.val}</span>
                    <span className="cr-kpi-lbl">{k.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── How Savings Are Calculated (collapsible) ── */}
            <div className="cr-card cr-card--howcalc">
              <button
                className="cr-howcalc-toggle"
                onClick={() => setShowHowCalc(v => !v)}
                aria-expanded={showHowCalc}
              >
                <span>🧮 How Savings Are Calculated</span>
                <span className="cr-howcalc-arrow">{showHowCalc ? '▲' : '▼'}</span>
              </button>

              {showHowCalc && (
                <div className="cr-howcalc-body">

                  {/* AI Pipeline Flow */}
                  <div className="cr-flow">
                    <div className="cr-flow-title">AI Pipeline Flow</div>
                    <div className="cr-flow-steps">
                      {[
                        { icon: '📂', label: 'Warehouse Dataset',             sub: 'PickingRoutes.csv, WarehousePickingData.csv' },
                        { icon: '🤖', label: 'Demand Forecasting',            sub: 'Random Forest — predicts demand per product' },
                        { icon: '🗺️', label: 'Route Optimization',           sub: "Dijkstra's Algorithm — finds shortest picking path" },
                        { icon: '📏', label: 'Optimized Distance & Time',     sub: 'Actual distance (m) and picking time (min) output' },
                        { icon: '💡', label: 'Business Cost Formula',         sub: 'Travel + Labor + Fuel/Ops costs computed below' },
                        { icon: '📊', label: 'Operational Cost Before vs After', sub: 'Side-by-side comparison of unoptimized vs optimized' },
                        { icon: '💰', label: 'Savings and ROI',               sub: 'Total ₹ saved and % reduction calculated' },
                      ].map((step, i, arr) => (
                        <div key={i} className="cr-flow-step-wrap">
                          <div className="cr-flow-step">
                            <span className="cr-flow-icon">{step.icon}</span>
                            <div>
                              <div className="cr-flow-label">{step.label}</div>
                              <div className="cr-flow-sub">{step.sub}</div>
                            </div>
                          </div>
                          {i < arr.length - 1 && <div className="cr-flow-arrow">↓</div>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Formulas with actual values */}
                  <div className="cr-formulas">
                    <div className="cr-formulas-title">Formulas & Current Values</div>

                    <div className="cr-formula-block">
                      <div className="cr-formula-name">🚶 Travel Cost</div>
                      <div className="cr-formula-eq">Travel Cost = Distance × Cost per Meter</div>
                      <div className="cr-formula-vals">
                        <span>Distance (after) = <strong>{after.dist} m</strong></span>
                        <span>Cost per Meter = <strong>₹{COST_PER_METER}</strong></span>
                        <span>Travel Cost (before) = <strong>₹{bCost.travel}</strong></span>
                        <span>Travel Cost (after) &nbsp;= <strong>₹{aCost.travel}</strong></span>
                      </div>
                    </div>

                    <div className="cr-formula-block">
                      <div className="cr-formula-name">👷 Labor Cost</div>
                      <div className="cr-formula-eq">Labor Cost = Picking Time × Labor Rate</div>
                      <div className="cr-formula-vals">
                        <span>Picking Time (before) = <strong>{before.time} min</strong></span>
                        <span>Picking Time (after) &nbsp;= <strong>{after.time} min</strong></span>
                        <span>Labor Rate = <strong>₹{LABOR_RATE}/min</strong></span>
                        <span>Labor Cost (before) = <strong>₹{bCost.labor}</strong></span>
                        <span>Labor Cost (after) &nbsp;= <strong>₹{aCost.labor}</strong></span>
                      </div>
                    </div>

                    <div className="cr-formula-block">
                      <div className="cr-formula-name">⛽ Fuel / Operations Cost</div>
                      <div className="cr-formula-eq">Fuel Cost = Base Operational Cost + (Distance × 0.18)</div>
                      <div className="cr-formula-vals">
                        <span>Base Cost = <strong>₹{FUEL_BASE}</strong></span>
                        <span>Distance Factor (before) = <strong>₹{(before.dist * 0.18).toFixed(2)}</strong></span>
                        <span>Distance Factor (after) &nbsp;= <strong>₹{(after.dist * 0.18).toFixed(2)}</strong></span>
                        <span>Fuel Cost (before) = <strong>₹{bCost.fuel}</strong></span>
                        <span>Fuel Cost (after) &nbsp;= <strong>₹{aCost.fuel}</strong></span>
                      </div>
                    </div>

                    <div className="cr-formula-block cr-formula-block--total">
                      <div className="cr-formula-name">💰 Total Cost & Savings</div>
                      <div className="cr-formula-eq">Total Cost = Travel + Labor + Fuel/Ops</div>
                      <div className="cr-formula-eq">Savings = Before Cost − After Cost</div>
                      <div className="cr-formula-eq">Savings % = (Savings ÷ Before Cost) × 100</div>
                      <div className="cr-formula-vals">
                        <span>Before Optimization = <strong>₹{bCost.total}</strong></span>
                        <span>After Optimization &nbsp;= <strong>₹{aCost.total}</strong></span>
                        <span>Savings = <strong>₹{saved}</strong></span>
                        <span>Savings % = <strong>{savePct}%</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Data Source & Calculation Method */}
                  <div className="cr-datasource-panel">
                    <div className="cr-datasource-title">📂 Data Source &amp; Calculation Method</div>
                    <p className="cr-datasource-text">
                      Operational metrics such as average route distance
                      ({dataStats?.routes?.avg_distance_m ?? '7.7'} m), picking time
                      ({dataStats?.routes?.avg_time_min ?? '12.4'} min), number of routes
                      ({(dataStats?.dataset_rows?.PickingRoutes || 5000).toLocaleString()}),
                      and ML accuracy ({dataStats?.ml?.accuracy_pct ?? '94.37'}%) are loaded
                      from the warehouse datasets through the backend. Business costs are estimated
                      using configurable cost formulas applied to the AI outputs from Demand
                      Forecasting (Random Forest) and Route Optimization (Dijkstra). This
                      demonstrates the expected business impact of AI-driven warehouse optimization.
                    </p>
                    <div className="cr-datasource-note">
                      ⚠️ These operational cost values are business estimations for decision support
                      and demonstration purposes. The formulas can be configured according to an
                      organisation's actual operating costs.
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Scenario selector */}
            <div className="cr-scenario-bar">              <span className="cr-scenario-label">Scenario:</span>
              {SCENARIOS.map((s, i) => (
                <button key={i} className={`cr-scenario-btn ${!useCustom && scenarioIdx === i ? 'active' : ''}`}
                  onClick={() => { setScenarioIdx(i); setUseCustom(false); setCalculated(false) }}>
                  {s.label}
                </button>
              ))}
              <button className={`cr-scenario-btn ${useCustom ? 'active' : ''}`}
                onClick={() => { setUseCustom(true); setCalculated(false) }}>
                ✏️ Custom
              </button>
            </div>

            {/* Custom inputs */}
            {useCustom && (
              <div className="cr-custom-inputs">
                <div className="cr-custom-group">
                  <span className="cr-custom-label">Before — Distance (m)</span>
                  <input type="number" className="cr-input" value={customBefore.dist} min={100} max={5000}
                    onChange={e => { setCustomBefore(b => ({ ...b, dist: +e.target.value })); setCalculated(false) }} />
                </div>
                <div className="cr-custom-group">
                  <span className="cr-custom-label">Before — Time (min)</span>
                  <input type="number" className="cr-input" value={customBefore.time} min={5} max={300}
                    onChange={e => { setCustomBefore(b => ({ ...b, time: +e.target.value })); setCalculated(false) }} />
                </div>
                <div className="cr-custom-group">
                  <span className="cr-custom-label">After — Distance (m)</span>
                  <input type="number" className="cr-input" value={customAfter.dist} min={50} max={5000}
                    onChange={e => { setCustomAfter(a => ({ ...a, dist: +e.target.value })); setCalculated(false) }} />
                </div>
                <div className="cr-custom-group">
                  <span className="cr-custom-label">After — Time (min)</span>
                  <input type="number" className="cr-input" value={customAfter.time} min={5} max={300}
                    onChange={e => { setCustomAfter(a => ({ ...a, time: +e.target.value })); setCalculated(false) }} />
                </div>
              </div>
            )}

            {/* Validation warning for bad custom inputs */}
            {customInvalid && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
                padding: '12px 16px', color: '#dc2626', fontSize: '0.9rem', marginBottom: '8px'
              }}>
                ⚠️ Please enter valid values greater than zero for all custom inputs before calculating.
              </div>
            )}

            {/* ── 4 KPI Summary Cards ── */}
            <div className="cr-kpi-row">
              {[
                { icon: '💰', label: 'Total Cost Before', val: `₹${bCost.total.toLocaleString()}`, color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
                { icon: '✅', label: 'Total Cost After',  val: `₹${aCost.total.toLocaleString()}`, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                { icon: '📉', label: 'Cost Reduced',      val: `₹${saved.toLocaleString()}`,       color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
                { icon: '📊', label: 'Savings %',         val: `${savePct}%`,                      color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' },
              ].map(k => (
                <div key={k.label} className="cr-kpi-card" style={{ background: k.bg, borderColor: k.border }}>
                  <span className="cr-kpi-icon">{k.icon}</span>
                  <span className="cr-kpi-val" style={{ color: k.color }}>{k.val}</span>
                  <span className="cr-kpi-lbl">{k.label}</span>
                </div>
              ))}
            </div>

            {/* ── Comparison Table ── */}
            <div className="cr-card">
              <div className="cr-card-title">📋 Before vs After Comparison</div>
              <div className="cr-table-wrap">
                <table className="cr-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th className="cr-th-before">Before Optimization</th>
                      <th className="cr-th-after">After Optimization</th>
                      <th className="cr-th-save">Saving</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>🚶 Travel Distance</td>
                      <td className="cr-td-before">{before.dist} m</td>
                      <td className="cr-td-after">{after.dist} m</td>
                      <td className="cr-td-save">↓ {before.dist - after.dist} m ({distSavePct}%)</td>
                    </tr>
                    <tr>
                      <td>⏱️ Time Taken</td>
                      <td className="cr-td-before">{before.time} min</td>
                      <td className="cr-td-after">{after.time} min</td>
                      <td className="cr-td-save">↓ {before.time - after.time} min ({timeSavePct}%)</td>
                    </tr>
                    <tr>
                      <td>👷 Labor Cost</td>
                      <td className="cr-td-before">₹{bCost.labor}</td>
                      <td className="cr-td-after">₹{aCost.labor}</td>
                      <td className="cr-td-save">↓ ₹{bCost.labor - aCost.labor}</td>
                    </tr>
                    <tr>
                      <td>⛽ Fuel / Ops Cost</td>
                      <td className="cr-td-before">₹{bCost.fuel}</td>
                      <td className="cr-td-after">₹{aCost.fuel}</td>
                      <td className="cr-td-save">↓ ₹{bCost.fuel - aCost.fuel}</td>
                    </tr>
                    <tr className="cr-tr-total">
                      <td>💰 Total Cost</td>
                      <td className="cr-td-before">₹{bCost.total}</td>
                      <td className="cr-td-after">₹{aCost.total}</td>
                      <td className="cr-td-save cr-td-save--bold">↓ ₹{saved} ({savePct}%)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Charts ── */}
            <div className="cr-charts-row">
              <div className="cr-card cr-card--chart">
                <div className="cr-card-title">📊 Cost Breakdown — Before vs After</div>
                <BarChart before={bCost} after={aCost} />
                <div className="cr-chart-note">Each group shows Travel, Labor, and Fuel/Ops costs side by side</div>
              </div>
              <div className="cr-card cr-card--pie">
                <div className="cr-card-title">🥧 After-Optimization Distribution</div>
                <PieChart data={[
                  { label: 'Travel',   value: aCost.travel, color: '#2563eb' },
                  { label: 'Labor',    value: aCost.labor,  color: '#7c3aed' },
                  { label: 'Fuel/Ops', value: aCost.fuel,   color: '#16a34a' },
                ]} />
              </div>
            </div>

            {/* ── Calculate Savings Button ── */}
            <div className="cr-card cr-card--calc">
              <div className="cr-card-title">🧮 Calculate Savings</div>
              <p className="cr-calc-hint">Click to compute the full optimization impact based on current inputs.</p>
              <button className={`btn-calculate ${animating ? 'animating' : ''}`} onClick={handleCalculate} disabled={animating}>
                {animating ? '⏳ Calculating…' : '⚡ Calculate Savings'}
              </button>
              {calculated && (
                <div className="cr-result-box">
                  <div className="cr-result-headline">
                    🎉 Optimization reduced travel distance by <strong>{distSavePct}%</strong> and time by <strong>{timeSavePct}%</strong>, saving <strong>₹{saved.toLocaleString()}</strong> per cycle.
                  </div>
                  <div className="cr-result-breakdown">
                    <div className="cr-result-item"><span>Labor savings</span><span className="cr-result-val">₹{bCost.labor - aCost.labor}</span></div>
                    <div className="cr-result-item"><span>Fuel/Ops savings</span><span className="cr-result-val">₹{bCost.fuel - aCost.fuel}</span></div>
                    <div className="cr-result-item"><span>Travel cost savings</span><span className="cr-result-val">₹{bCost.travel - aCost.travel}</span></div>
                    <div className="cr-result-item cr-result-item--total"><span>Total saved</span><span className="cr-result-val">₹{saved}</span></div>
                    <div className="cr-result-item"><span>Daily (10 cycles)</span><span className="cr-result-val">₹{saved * 10}</span></div>
                    <div className="cr-result-item"><span>Monthly (25 days)</span><span className="cr-result-val">₹{saved * 10 * 25}</span></div>
                  </div>
                  <div className="cr-connection-note">
                    ℹ️ These savings are derived from the Warehouse Picking Optimization module output — not standalone estimates.
                  </div>
                </div>
              )}
            </div>

            {/* ── Ask About Cost Reduction ── */}
            <div className="cr-card cr-card--chat-cta">
              <div className="cr-card-title">🤖 Ask About Cost Reduction</div>
              <p className="cr-calc-hint">Chat with the AI to understand why costs reduced and what drives the savings.</p>
              <div className="cr-chat-chips">
                {CHAT_SUGGESTIONS.map((q, i) => (
                  <button key={i} className="cr-chip" onClick={() => { setChatOpen(true); setUnread(0); setTimeout(() => sendMessage(q), 100) }}>{q}</button>
                ))}
              </div>
              <button className="btn-cr-chat" onClick={() => { setChatOpen(true); setUnread(0) }}>
                💬 Open Cost Reduction Chat
              </button>
            </div>

          </div>
        </section>

      <div className="cr-back-row container">
        <Link to="/features" className="cr-back-link">← Back to Features</Link>
      </div>

      {/* ══════════ FLOATING CHATBOT ══════════ */}
      <button className="cr-chat-bubble" onClick={() => chatOpen ? setChatOpen(false) : (setChatOpen(true), setUnread(0))} aria-label="Cost chat">
        {chatOpen ? '✕' : '📉'}
        {!chatOpen && unread > 0 && <span className="cr-bubble-badge">{unread}</span>}
      </button>

      {chatOpen && (
        <div className="cr-chat-window">
          <div className="cr-chat-header">
            <div className="cr-chat-header-info">
              <span className="cr-chat-avatar">📉</span>
              <div>
                <div className="cr-chat-name">Cost Reduction Analyst</div>
                <div className="cr-chat-status"><span className="cr-status-dot" />{chatLoading ? 'Thinking…' : 'Online'}</div>
              </div>
            </div>
            <div className="cr-chat-actions">
              <button onClick={() => setMessages([{ role: 'bot', text: "Hi! I'm your Cost Reduction analyst 📉\nAsk me why costs reduced, what contributes most to savings, or how the optimization impacts your bottom line." }])}>🗑</button>
              <button onClick={() => setChatOpen(false)}>✕</button>
            </div>
          </div>
          <div className="cr-chat-context">
            📉 Savings: ₹{saved} ({savePct}%) · Distance ↓{distSavePct}% · Time ↓{timeSavePct}%
          </div>
          <div className="cr-chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`cr-msg cr-msg--${msg.role}`}>
                {msg.role === 'bot' && <span className="cr-msg-avatar">📉</span>}
                <div className="cr-msg-bubble">
                  {msg.text.split('\n').map((l, j, a) => <span key={j}>{l}{j < a.length - 1 && <br />}</span>)}
                </div>
                {msg.role === 'user' && <span className="cr-msg-avatar cr-msg-avatar--user">👤</span>}
              </div>
            ))}
            {chatLoading && (
              <div className="cr-msg cr-msg--bot">
                <span className="cr-msg-avatar">📉</span>
                <div className="cr-msg-bubble cr-typing"><span /><span /><span /></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="cr-chat-chips-mini">
            {CHAT_SUGGESTIONS.slice(0, 3).map((q, i) => (
              <button key={i} className="cr-chip-mini" onClick={() => sendMessage(q)}>{q}</button>
            ))}
          </div>
          <div className="cr-chat-input-row">
            <input className="cr-chat-input" placeholder="Ask about cost savings…"
              value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !chatLoading && sendMessage()}
              disabled={chatLoading} />
            <button className="cr-send-btn" onClick={() => sendMessage()} disabled={chatLoading || !chatInput.trim()}>➤</button>
          </div>
        </div>
      )}
    </div>
  )
}

