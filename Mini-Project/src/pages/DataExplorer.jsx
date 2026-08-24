import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './DataExplorer.css'

const API = 'http://localhost:5000/api'

const DATASETS = [
  { key: 'OrderList',             icon: '📦', label: 'Order List',             desc: '50,000 supply chain orders' },
  { key: 'FreightRates',          icon: '🚚', label: 'Freight Rates',          desc: 'Carrier rate tables by weight band' },
  { key: 'WhCosts',               icon: '🏭', label: 'Warehouse Costs',        desc: 'Cost per unit per plant' },
  { key: 'WhCapacities',          icon: '📐', label: 'WH Capacities',          desc: 'Daily capacity & layout info' },
  { key: 'WarehousePickingData',  icon: '🗺️', label: 'Picking Data',           desc: '36,500 rows — core ML dataset' },
  { key: 'PickingRoutes',         icon: '🛤️', label: 'Picking Routes',         desc: '5,000 historical routes' },
  { key: 'InventoryTransactions', icon: '📊', label: 'Inventory Transactions', desc: '20,000 stock movements' },
  { key: 'CarrierPerformance',    icon: '⭐', label: 'Carrier Performance',    desc: 'Monthly KPIs per carrier' },
  { key: 'WarehouseLayout',       icon: '🗂️', label: 'Warehouse Layout',       desc: 'Aisle-level spatial data' },
  { key: 'ProductsPerPlant',      icon: '🔧', label: 'Products Per Plant',     desc: 'Product-plant assignments' },
  { key: 'PlantPorts',            icon: '⚓', label: 'Plant Ports',            desc: 'Plant to port mapping' },
  { key: 'VmiCustomers',          icon: '👥', label: 'VMI Customers',          desc: 'VMI customer assignments' },
]

export default function DataExplorer() {
  const navigate  = useNavigate()
  const token     = localStorage.getItem('token')

  const [summary,   setSummary]   = useState({})
  const [active,    setActive]    = useState(null)
  const [columns,   setColumns]   = useState([])
  const [tableData, setTableData] = useState([])
  const [totalRows, setTotalRows] = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [backendOk, setBackendOk] = useState(null)   // null=checking, true, false

  // ── 1. Check backend health ──────────────────────────────────────────────
  useEffect(() => {
    if (!token) { navigate('/login'); return; }

    fetch(`${API}/health`)
      .then(r => r.json())
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false))
  }, [token, navigate])

  // ── 2. Load summary once backend is confirmed up ─────────────────────────
  useEffect(() => {
    if (!backendOk || !token) return
    fetch(`${API}/data/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setSummary)
      .catch(() => {})
  }, [backendOk, token])

  // ── 3. Load a dataset ────────────────────────────────────────────────────
  const loadDataset = async (key) => {
    if (!token) { navigate('/login'); return; }
    setActive(key)
    setLoading(true)
    setError('')
    setTableData([])
    setColumns([])

    try {
      const res = await fetch(`${API}/data/${key}?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      setColumns(json.columns  || (json.data?.length ? Object.keys(json.data[0]) : []))
      setTableData(json.data   || [])
      setTotalRows(json.total  || 0)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  const statusBadge = (key) => {
    const info = summary[`${key}.csv`]
    if (!info) return null
    if (info.status === 'not_generated') return <span className="badge badge-warn">⚠ Not generated</span>
    return <span className="badge badge-ok">{info.rows.toLocaleString()} rows</span>
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="explorer-page">
      <section className="explorer-hero">
        <div className="container">
          <h1 className="page-title">Dataset Explorer</h1>
          <p className="page-subtitle">
            Browse the 12 generated supply chain datasets powering the AI system
          </p>

          {/* Backend status banner */}
          {backendOk === false && (
            <div className="banner banner-error">
              ❌ Cannot reach backend at <code>localhost:5000</code>.
              Run <code>cd backend &amp;&amp; npm run dev</code> first.
            </div>
          )}
          {backendOk === null && (
            <div className="banner banner-info">⏳ Checking backend connection…</div>
          )}
          {backendOk === true && Object.keys(summary).length > 0 &&
            Object.values(summary).every(s => s.status === 'not_generated') && (
            <div className="banner banner-warn">
              ⚠ Datasets not generated yet. Run:&nbsp;
              <code>cd backend &amp;&amp; python ml/generate_supply_chain_dataset.py</code>
            </div>
          )}
        </div>
      </section>

      <section className="explorer-body">
        <div className="container explorer-layout">

          {/* ── Sidebar ── */}
          <div className="explorer-sidebar">
            {DATASETS.map(({ key, icon, label, desc }) => (
              <button
                key={key}
                className={`ds-card ${active === key ? 'active' : ''}`}
                onClick={() => loadDataset(key)}
                disabled={!backendOk}
              >
                <div className="ds-top">
                  <span className="ds-icon">{icon}</span>
                  <span className="ds-label">{label}</span>
                  {statusBadge(key)}
                </div>
                <span className="ds-desc">{desc}</span>
              </button>
            ))}
          </div>

          {/* ── Main panel ── */}
          <div className="explorer-main">

            {/* Empty state */}
            {!active && !loading && (
              <div className="explorer-empty">
                <span style={{ fontSize: '3rem' }}>📂</span>
                <p>Select a dataset from the left to preview it</p>
                {backendOk && (
                  <p className="hint">
                    If rows show <em>0</em>, run:<br />
                    <code>cd backend &amp;&amp; python ml/generate_supply_chain_dataset.py</code>
                  </p>
                )}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="explorer-loading">
                <div className="spinner" />
                <span>Loading {active}…</span>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="explorer-error">
                <span style={{ fontSize: '2rem' }}>⚠️</span>
                <p>{error}</p>
                {error.includes('not found') && (
                  <p className="hint">
                    Generate datasets first:<br />
                    <code>cd backend &amp;&amp; python ml/generate_supply_chain_dataset.py</code>
                  </p>
                )}
              </div>
            )}

            {/* Table */}
            {!loading && !error && tableData.length > 0 && (
              <>
                <div className="table-header">
                  <span className="table-title">{active}</span>
                  <span className="table-meta">
                    Showing 50 of <strong>{totalRows.toLocaleString()}</strong> rows
                    &nbsp;·&nbsp; {columns.length} columns
                  </span>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {columns.map(c => <th key={c}>{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, i) => (
                        <tr key={i}>
                          {columns.map(c => (
                            <td key={c} title={row[c]}>{row[c]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
