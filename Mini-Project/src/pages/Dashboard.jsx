import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

const API = 'http://localhost:5000/api'
const getToken = () => localStorage.getItem('token')

// ── Fetch helper with clear error messages ────────────────────────────────
async function apiFetch(endpoint, body) {
  let res
  try {
    res = await fetch(`${API}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    })
  } catch (networkErr) {
    throw new Error(
      'Cannot reach backend. Make sure the server is running: cd backend && npm run dev'
    )
  }
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `Server error ${res.status}`)
  return json
}

// ── Default form values (populated from dataset averages on load) ─────────
const DEMO_DEMAND = {
  product_id: 'P001', warehouse_location: 'Zone-A', category: 'Electronics',
  aisle_number: 3, inventory_level: 149, reorder_point: 64,
  lead_time_days: 7, unit_price: 199.99, day_of_week: 2,
  month: 4, is_weekend: 0, rolling_avg_7d: 75,
}

const DEMO_ROUTE = {
  aisles: '3, 5, 7, 10, 12',
  start_aisle: '1',
}

const ENGINE_LABEL = {
  python_rf:       '🐍 Python Random Forest',
  python_dijkstra: '🐍 Python Dijkstra',
  js_rule_based:   '⚡ JS Rule Engine',
  js_dijkstra:     '⚡ JS Dijkstra',
  js_fallback:     '⚡ JS Fallback',
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()

  const [demand,   setDemand]   = useState(null)
  const [route,    setRoute]    = useState(null)
  const [insights, setInsights] = useState(null)
  const [loading,  setLoading]  = useState({ demand: false, route: false, insights: false })
  const [errors,   setErrors]   = useState({})
  const [demandForm, setDemandForm] = useState(DEMO_DEMAND)
  const [routeForm,  setRouteForm]  = useState(DEMO_ROUTE)   // FIX: was never declared
  const [dataStats, setDataStats] = useState(null)

  useEffect(() => { if (!getToken()) navigate('/login') }, [navigate])

  // Load live dataset stats
  useEffect(() => {
    fetch(`${API}/data/stats`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => {
        setDataStats(data)
        // Pre-fill form with real dataset averages
        if (data.picking) {
          setDemandForm(f => ({
            ...f,
            inventory_level: Math.round(data.picking.avg_inventory) || f.inventory_level,
            reorder_point:   Math.round(data.picking.avg_reorder_point) || f.reorder_point,
            lead_time_days:  Math.round(data.picking.avg_lead_time) || f.lead_time_days,
            rolling_avg_7d:  Math.round(data.picking.avg_demand) || f.rolling_avg_7d,
          }))
        }
      })
      .catch(() => {})
  }, [])

  const setLoad = (k, v) => setLoading(p => ({ ...p, [k]: v }))
  const setErr  = (k, v) => setErrors(p  => ({ ...p, [k]: v }))

  // ── Demand prediction ─────────────────────────────────────────────────
  const runDemand = async () => {
    setLoad('demand', true); setErr('demand', '')
    try {
      const result = await apiFetch('/predict-demand', demandForm)
      setDemand(result)
    } catch (e) { setErr('demand', e.message) }
    finally { setLoad('demand', false) }
  }

  // ── Route optimisation ────────────────────────────────────────────────
  const runRoute = async () => {
    setLoad('route', true); setErr('route', '')
    try {
      const aisles = routeForm.aisles
        .split(',').map(a => parseInt(a.trim())).filter(Boolean)
      const result = await apiFetch('/optimize-route', {
        aisles, start_aisle: Number(routeForm.start_aisle)
      })
      setRoute(result)
    } catch (e) { setErr('route', e.message) }
    finally { setLoad('route', false) }
  }

  // ── AI Insights ───────────────────────────────────────────────────────
  const runInsights = async () => {
    if (!demand && !route) return
    setLoad('insights', true); setErr('insights', '')
    try {
      const result = await apiFetch('/get-insights', {
        predicted_demand:      demand?.predicted_demand ?? 0,
        inventory_level:       demandForm.inventory_level,
        reorder_point:         demandForm.reorder_point,
        total_distance_meters: route?.total_distance_meters ?? 0,
        product_id:            demandForm.product_id,
        warehouse_location:    demandForm.warehouse_location,
      })
      setInsights(result)
    } catch (e) { setErr('insights', e.message) }
    finally { setLoad('insights', false) }
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div className="container">
          <div className="dashboard-header-row">
            <div>
              <h1 className="page-title">Warehouse Operations Dashboard</h1>
              <p className="page-subtitle">Real-time AI-powered warehouse analytics, operational monitoring, and business intelligence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dataset Stats Overview ─────────────────────────────────────── */}
      {dataStats && (
        <section className="dashboard-panel">
          <div className="container">
            <div className="panel-card">
              <h2 className="panel-title">📊 Live Dataset Overview</h2>
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                {[
                  { label: 'Orders',           val: (dataStats.dataset_rows?.OrderList || 0).toLocaleString(),            icon: '📦' },
                  { label: 'Picking Records',   val: (dataStats.dataset_rows?.WarehousePickingData || 0).toLocaleString(), icon: '🗺️' },
                  { label: 'Routes',            val: (dataStats.dataset_rows?.PickingRoutes || 0).toLocaleString(),        icon: '🛤️' },
                  { label: 'Inv. Transactions', val: (dataStats.dataset_rows?.InventoryTransactions || 0).toLocaleString(),icon: '📊' },
                  { label: 'Carrier Records',   val: (dataStats.dataset_rows?.CarrierPerformance || 0).toLocaleString(),   icon: '⭐' },
                  { label: 'Avg Demand',        val: `${dataStats.picking?.avg_demand ?? '—'} units`,                     icon: '📈' },
                  { label: 'Avg Inventory',     val: `${dataStats.picking?.avg_inventory ?? '—'} units`,                  icon: '🏭' },
                  { label: 'Avg Pick Time',     val: `${dataStats.picking?.avg_picking_time ?? '—'} min`,                 icon: '⏱️' },
                  { label: 'Avg Route Dist',    val: `${dataStats.routes?.avg_distance_m ?? '—'} m`,                      icon: '📍' },
                  { label: 'On-Time Delivery',  val: `${dataStats.carrier?.avg_on_time_pct ?? '—'}%`,                     icon: '🚚' },
                  { label: 'ML Accuracy',       val: `${dataStats.ml?.accuracy_pct ?? '—'}%`,                             icon: '🤖' },
                  { label: 'Model R²',          val: dataStats.ml?.tuned?.r2 ?? '—',                                      icon: '🎯' },
                ].map(k => (
                  <div key={k.label} className="result-box" style={{ textAlign: 'center', padding: '12px 8px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{k.icon}</span>
                    <span className="result-value" style={{ fontSize: '1.1rem', display: 'block', marginTop: '4px' }}>{k.val}</span>
                    <span className="result-label" style={{ fontSize: '0.75rem' }}>{k.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Demand Forecasting ─────────────────────────────────────────── */}
      <section className="dashboard-panel">
        <div className="container">
          <div className="panel-card">
            <h2 className="panel-title">📊 Demand Forecasting</h2>

            <div className="form-grid">
              {['product_id','warehouse_location','category'].map(k => (
                <div key={k} className="form-group">
                  <label>{k.replace(/_/g,' ')}</label>
                  <input className="login-input" value={demandForm[k]}
                    onChange={e => setDemandForm({...demandForm,[k]:e.target.value})} />
                </div>
              ))}
              {['aisle_number','inventory_level','reorder_point','lead_time_days',
                'unit_price','day_of_week','month','is_weekend','rolling_avg_7d'].map(k => (
                <div key={k} className="form-group">
                  <label>{k.replace(/_/g,' ')}</label>
                  <input className="login-input" type="number" value={demandForm[k]}
                    onChange={e => setDemandForm({...demandForm,[k]:parseFloat(e.target.value)||0})} />
                </div>
              ))}
            </div>

            <button className="btn btn-primary" onClick={runDemand}
              disabled={loading.demand}>
              {loading.demand ? 'Predicting…' : 'Predict Demand'}
            </button>

            {errors.demand && (
              <div className="error-box">
                <span>⚠️</span>
                <p>{errors.demand}</p>
              </div>
            )}

            {demand && (
              <div className="result-row">
                <div className="result-box">
                  <span className="result-label">Predicted Demand</span>
                  <span className="result-value">{demand.predicted_demand} units</span>
                </div>
                {demand.engine && (
                  <div className="engine-badge">
                    {ENGINE_LABEL[demand.engine] || demand.engine}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Route Optimisation ─────────────────────────────────────── */}
      <section className="dashboard-panel">
        <div className="container">
          <div className="panel-card">
            <h2 className="panel-title">🗺️ Route Optimisation</h2>
            <p className="panel-hint">Enter aisle numbers to pick from (comma-separated) and the start aisle.</p>

            <div className="form-grid">
              <div className="form-group">
                <label>Aisles to visit</label>
                <input
                  className="login-input"
                  placeholder="e.g. 3, 5, 7, 10, 12"
                  value={routeForm.aisles}
                  onChange={e => setRouteForm({ ...routeForm, aisles: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Start aisle</label>
                <input
                  className="login-input"
                  type="number"
                  value={routeForm.start_aisle}
                  onChange={e => setRouteForm({ ...routeForm, start_aisle: e.target.value })}
                />
              </div>
            </div>

            <button className="btn btn-primary" onClick={runRoute} disabled={loading.route}>
              {loading.route ? 'Optimising…' : 'Optimise Route'}
            </button>

            {errors.route && (
              <div className="error-box">
                <span>⚠️</span>
                <p>{errors.route}</p>
              </div>
            )}

            {route && (
              <div className="result-row">
                <div className="result-box">
                  <span className="result-label">Optimised Order</span>
                  <span className="result-value">{route.optimized_order?.join(' → ')}</span>
                </div>
                <div className="result-box">
                  <span className="result-label">Total Distance</span>
                  <span className="result-value">{route.total_distance_meters} m</span>
                </div>
                <div className="result-box">
                  <span className="result-label">Est. Time</span>
                  <span className="result-value">{route.estimated_time_minutes} min</span>
                </div>
                {route.engine && (
                  <div className="engine-badge">
                    {ENGINE_LABEL[route.engine] || route.engine}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── AI Insights ────────────────────────────────────────────────── */}
      <section className="dashboard-panel">
        <div className="container">
          <div className="panel-card">
            <h2 className="panel-title">🤖 AI Insights</h2>
            <p className="panel-hint">
              Run demand prediction and/or route optimisation first, then generate insights.
            </p>

            <button className="btn btn-primary" onClick={runInsights}
              disabled={loading.insights || (!demand && !route)}>
              {loading.insights ? 'Generating…' : 'Get AI Insights'}
            </button>

            {errors.insights && (
              <div className="error-box">
                <span>⚠️</span>
                <p>{errors.insights}</p>
              </div>
            )}

            {insights && (
              <div className="insights-box">
                <p className="insights-summary">{insights.summary}</p>
                <div className="insights-section">
                  <strong>Insights</strong>
                  <ul>{insights.insights.map((item, i) => <li key={i}>{item}</li>)}</ul>
                </div>
                <div className="insights-section">
                  <strong>Suggestions</strong>
                  <ul>{insights.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

