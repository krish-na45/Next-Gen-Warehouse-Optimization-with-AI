import { useState, useEffect } from 'react'
import './SystemModules.css'
import { Link } from 'react-router-dom'

const API = 'http://localhost:5000/api'

const modules = [
  {
    icon: '📥',
    title: 'Data Collection Module',
    description: 'Gathers inventory, orders, and sensor data from warehouse systems.',
  },
  {
    icon: '🔧',
    title: 'Data Preprocessing Module',
    description: 'Cleans and normalizes data for ML pipelines.',
  },
  {
    icon: '📈',
    title: 'ML Forecasting Module',
    description: 'Runs demand prediction models and generates forecasts.',
  },
  {
    icon: '🗺️',
    title: 'Path Optimization Engine',
    description: 'Computes optimal picking routes using AI algorithms.',
  },
  {
    icon: '🤖',
    title: 'LLM Reasoning Module',
    description: 'Provides explainable insights and decision support.',
  },
]

export default function SystemModules() {
  const [dataStats, setDataStats] = useState(null)

  useEffect(() => {
    fetch(`${API}/data/stats`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(setDataStats)
      .catch(() => {})
  }, [])

  return (
    <div className="system-modules-page">
      <section className="modules-hero">
        <div className="container">
          <h1 className="page-title">System Modules</h1>
          <p className="page-subtitle">
            Architecture components that power the optimization pipeline
          </p>
        </div>
      </section>

      {/* ── Live Dataset Stats ── */}
      {dataStats && (
        <section style={{ background: '#f8fafc', padding: '24px 0', borderBottom: '1px solid #e2e8f0' }}>
          <div className="container">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#475569', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              📊 Live Dataset Stats
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
              {[
                { icon: '📦', label: 'Orders',            val: (dataStats.dataset_rows?.OrderList || 0).toLocaleString() },
                { icon: '🗺️', label: 'Picking Records',   val: (dataStats.dataset_rows?.WarehousePickingData || 0).toLocaleString() },
                { icon: '🛤️', label: 'Routes',            val: (dataStats.dataset_rows?.PickingRoutes || 0).toLocaleString() },
                { icon: '📊', label: 'Inv. Transactions', val: (dataStats.dataset_rows?.InventoryTransactions || 0).toLocaleString() },
                { icon: '⭐', label: 'Carrier Records',   val: (dataStats.dataset_rows?.CarrierPerformance || 0).toLocaleString() },
                { icon: '🏭', label: 'Products/Plant',    val: (dataStats.dataset_rows?.ProductsPerPlant || 0).toLocaleString() },
                { icon: '📈', label: 'Avg Demand',        val: `${dataStats.picking?.avg_demand ?? '—'} units` },
                { icon: '🏪', label: 'Avg Inventory',     val: `${dataStats.picking?.avg_inventory ?? '—'} units` },
                { icon: '⏱️', label: 'Avg Pick Time',     val: `${dataStats.picking?.avg_picking_time ?? '—'} min` },
                { icon: '📍', label: 'Avg Route Dist',    val: `${dataStats.routes?.avg_distance_m ?? '—'} m` },
                { icon: '🚚', label: 'On-Time Delivery',  val: `${dataStats.carrier?.avg_on_time_pct ?? '—'}%` },
                { icon: '🤖', label: 'ML Accuracy',       val: `${dataStats.ml?.accuracy_pct ?? '—'}%` },
              ].map(k => (
                <div key={k.label} style={{
                  background: '#fff', borderRadius: '10px', padding: '14px 10px',
                  textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ fontSize: '1.5rem' }}>{k.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', margin: '4px 0 2px' }}>{k.val}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="modules-list-section">
        <div className="container">
          <div className="modules-list">
            {modules.map((m, i) => (
              <div key={m.title} className="module-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <span className="module-icon">{m.icon}</span>
                <div className="module-content">
                  <h2 className="module-title">{m.title}</h2>
                  <p className="module-desc">{m.description}</p>
                  <div className="module-actions">
                    <Link to="/system-modules/workflow" className="btn btn-primary">
                      View Workflow
                    </Link>
                    <Link to="/system-modules/details" className="btn btn-secondary">
                      Module Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

