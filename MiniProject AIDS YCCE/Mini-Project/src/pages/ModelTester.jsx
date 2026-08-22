import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './ModelTester.css'

const API = 'http://localhost:5000/api'

// ── Sample datasets for download ──────────────────────────────────────────
const SAMPLE_DATASETS = [
  {
    name: 'Electronics Dataset',
    description: 'High-value electronics items with actual demand labels. Produces R², MAE & RMSE metrics.',
    badge: '✅ With Labels',
    badgeClass: 'badge-with-labels',
    filename: 'test_electronics.csv',
    content: `product_id,inventory_level,warehouse_location,aisle_number,picking_time,reorder_point,lead_time_days,unit_price,category,day_of_week,month,is_weekend,demand
P001,120,Zone-A,3,8.50,80,5,450.00,Electronics,1,6,0,42
P002,45,Zone-B,7,12.30,80,3,299.99,Electronics,3,11,0,78
P003,200,Zone-C,1,6.20,60,7,899.00,Electronics,5,12,1,31
P004,15,Zone-A,9,14.80,80,2,149.99,Electronics,6,12,1,95
P005,300,Zone-D,4,5.10,100,4,75.00,Electronics,0,3,0,55
P006,60,Zone-E,11,10.40,80,6,520.00,Electronics,2,8,0,38
P007,8,Zone-B,2,16.20,80,1,199.99,Electronics,4,11,0,110
P008,175,Zone-C,6,7.80,90,5,350.00,Electronics,1,7,0,47
P009,30,Zone-A,8,13.60,80,3,650.00,Electronics,3,10,0,29
P010,90,Zone-D,5,9.20,70,4,120.00,Electronics,5,12,1,68`,
  },
  {
    name: 'Grocery Dataset',
    description: 'Fast-moving grocery items with actual demand labels. Produces R², MAE & RMSE metrics.',
    badge: '✅ With Labels',
    badgeClass: 'badge-with-labels',
    filename: 'test_grocery.csv',
    content: `product_id,inventory_level,warehouse_location,aisle_number,picking_time,reorder_point,lead_time_days,unit_price,category,day_of_week,month,is_weekend,demand
P011,500,Zone-A,1,4.20,200,2,12.50,Grocery,0,1,0,180
P012,80,Zone-B,3,6.80,200,1,8.99,Grocery,6,12,1,240
P013,350,Zone-C,2,5.10,150,3,22.00,Grocery,3,6,0,130
P014,120,Zone-A,4,7.30,200,2,5.49,Grocery,5,11,1,210
P015,600,Zone-D,1,3.90,250,1,15.00,Grocery,2,4,0,160
P016,40,Zone-B,5,9.10,200,2,9.99,Grocery,4,12,0,195
P017,280,Zone-C,3,5.60,180,3,18.75,Grocery,1,8,0,145
P018,90,Zone-A,2,8.40,200,1,6.25,Grocery,6,12,1,225
P019,450,Zone-E,1,4.50,200,2,11.00,Grocery,0,3,0,170
P020,160,Zone-D,4,6.90,150,4,24.99,Grocery,3,9,0,138`,
  },
  {
    name: 'Mixed Categories (No Labels)',
    description: 'Mixed product categories without demand labels. Returns predictions only — no metrics.',
    badge: '🔮 Predictions Only',
    badgeClass: 'badge-no-labels',
    filename: 'test_mixed_no_labels.csv',
    content: `product_id,inventory_level,warehouse_location,aisle_number,picking_time,reorder_point,lead_time_days,unit_price,category,day_of_week,month,is_weekend
P021,75,Zone-A,6,11.20,80,5,320.00,Pharmaceuticals,2,7,0
P022,200,Zone-C,3,7.40,100,3,45.00,Apparel,5,12,1
P023,30,Zone-B,9,14.10,80,2,780.00,Electronics,6,11,1
P024,400,Zone-D,2,4.80,150,4,18.00,Grocery,1,2,0
P025,55,Zone-E,7,12.60,80,6,95.00,Automotive,3,5,0
P026,180,Zone-A,4,8.30,90,3,210.00,Apparel,4,10,0
P027,10,Zone-B,11,17.50,80,1,1200.00,Electronics,0,12,0
P028,320,Zone-C,1,5.20,120,5,35.00,Grocery,6,12,1
P029,65,Zone-D,8,10.90,80,4,480.00,Pharmaceuticals,2,3,0
P030,140,Zone-E,5,9.60,100,3,62.00,Textiles,1,6,0`,
  },
]

function downloadSample(dataset) {
  const blob = new Blob([dataset.content], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = dataset.filename; a.click()
  URL.revokeObjectURL(url)
}

export default function ModelTester() {
  const navigate = useNavigate()
  const token    = localStorage.getItem('token')

  const [file,        setFile]        = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [result,      setResult]      = useState(null)
  const [showAll,     setShowAll]     = useState(false)
  const [baseStats,   setBaseStats]   = useState(null)   // from model_metrics.json (fixed)
  const [liveStats,   setLiveStats]   = useState(null)   // from uploaded dataset (dynamic)

  useEffect(() => { if (!token) navigate('/login') }, [token, navigate])

  // Load base model metrics once on mount
  useEffect(() => {
    fetch(`${API}/model-metrics`)
      .then(r => r.json())
      .then(data => { if (!data.error) setBaseStats(data) })
      .catch(() => {})
  }, [])

  const handleFile = (e) => {
    setFile(e.target.files[0])
    setResult(null)
    setLiveStats(null)
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped) { setFile(dropped); setResult(null); setLiveStats(null); setError('') }
  }

  const handleSubmit = async () => {
    if (!file) return setError('Please select a CSV or Excel file first.')
    setLoading(true)
    setError('')
    setResult(null)
    setLiveStats(null)

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch(`${API}/upload/predict`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    form,
      })

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        if (res.status === 404) throw new Error('Upload route not found. Restart the backend.')
        if (res.status === 401 || res.status === 403) throw new Error('Session expired. Please log in again.')
        throw new Error(`Server error (${res.status}). Is the backend running?`)
      }

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Server error ${res.status}`)
      setResult(json)

      // ── Update accuracy card with this dataset's metrics ──
      if (json.has_labels && json.metrics) {
        setLiveStats({
          accuracy_pct: parseFloat((json.metrics.r2 * 100).toFixed(2)),
          r2:           json.metrics.r2,
          mae:          json.metrics.mae,
          rmse:         json.metrics.rmse,
          total_rows:   json.total_rows,
          filename:     file.name,
        })
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    if (!result) return
    const rows = result.all_predictions.map((p, i) => `${i + 1},${p}`)
    const csv  = ['row,predicted_demand', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'predictions.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // Use liveStats if available, else fall back to baseStats
  const displayStats = liveStats || (baseStats ? {
    accuracy_pct: baseStats.accuracy_pct,
    r2:           baseStats.tuned.r2,
    mae:          baseStats.tuned.mae,
    rmse:         baseStats.tuned.rmse,
    total_rows:   baseStats.dataset_rows,
    filename:     null,
  } : null)

  const isLive = !!liveStats

  return (
    <div className="tester-page">
      <section className="tester-hero">
        <div className="container">
          <h1 className="page-title">🧪 Model Tester</h1>
          <p className="page-subtitle">Upload a CSV or Excel dataset and run batch predictions</p>
        </div>
      </section>

      <section className="tester-body">
        <div className="container tester-layout">

          {/* ── Accuracy Card — updates on upload ── */}
          {displayStats && (
            <div className={`accuracy-card ${isLive ? 'accuracy-card-live' : ''}`}>
              <div className="accuracy-left">
                <div className="accuracy-ring">
                  <svg viewBox="0 0 120 120" className="ring-svg">
                    <circle cx="60" cy="60" r="50" className="ring-bg" />
                    <circle cx="60" cy="60" r="50" className="ring-fill"
                      strokeDasharray={`${Math.min(displayStats.accuracy_pct, 100) * 3.14159} 314.159`}
                    />
                  </svg>
                  <div className="ring-label">
                    <span className="ring-pct">{displayStats.accuracy_pct}%</span>
                    <span className="ring-sub">Accuracy</span>
                  </div>
                </div>
              </div>

              <div className="accuracy-right">
                <div className="accuracy-title-row">
                  <h2 className="accuracy-title">🤖 Model Performance</h2>
                  {isLive
                    ? <span className="badge-live">📂 {displayStats.filename}</span>
                    : <span className="badge-base">Base Model</span>
                  }
                </div>
                <p className="accuracy-model">
                  {baseStats?.model || 'RandomForestRegressor'}
                  {isLive
                    ? ` · Evaluated on uploaded dataset (${displayStats.total_rows} rows)`
                    : ` · Trained ${baseStats?.trained_on}`
                  }
                </p>

                <div className="accuracy-metrics">
                  <div className="acc-metric">
                    <span className="acc-metric-val">{displayStats.r2}</span>
                    <span className="acc-metric-lbl">R² Score</span>
                  </div>
                  <div className="acc-metric">
                    <span className="acc-metric-val">{displayStats.mae}</span>
                    <span className="acc-metric-lbl">MAE (units)</span>
                  </div>
                  <div className="acc-metric">
                    <span className="acc-metric-val">{displayStats.rmse}</span>
                    <span className="acc-metric-lbl">RMSE (units)</span>
                  </div>
                  <div className="acc-metric">
                    <span className="acc-metric-val">{displayStats.total_rows.toLocaleString()}</span>
                    <span className="acc-metric-lbl">{isLive ? 'Uploaded Rows' : 'Total Dataset'}</span>
                  </div>
                  {!isLive && (
                    <>
                      <div className="acc-metric">
                        <span className="acc-metric-val">{baseStats.test_rows.toLocaleString()}</span>
                        <span className="acc-metric-lbl">Test Rows</span>
                      </div>
                      <div className="acc-metric">
                        <span className="acc-metric-val">80 / 20</span>
                        <span className="acc-metric-lbl">Train / Test Split</span>
                      </div>
                    </>
                  )}
                  {isLive && baseStats && (
                    <>
                      <div className="acc-metric acc-metric-compare">
                        <span className="acc-metric-val">
                          {displayStats.r2 >= baseStats.tuned.r2
                            ? <span className="delta-up">▲ {(displayStats.r2 - baseStats.tuned.r2).toFixed(4)}</span>
                            : <span className="delta-down">▼ {(baseStats.tuned.r2 - displayStats.r2).toFixed(4)}</span>
                          }
                        </span>
                        <span className="acc-metric-lbl">vs Base R²</span>
                      </div>
                      <div className="acc-metric acc-metric-compare">
                        <span className="acc-metric-val">
                          {displayStats.mae <= baseStats.tuned.mae
                            ? <span className="delta-up">▲ Better</span>
                            : <span className="delta-down">▼ +{(displayStats.mae - baseStats.tuned.mae).toFixed(2)}</span>
                          }
                        </span>
                        <span className="acc-metric-lbl">vs Base MAE</span>
                      </div>
                    </>
                  )}
                </div>

                {isLive && (
                  <button className="btn-reset-stats" onClick={() => setLiveStats(null)}>
                    ↩ Reset to base model stats
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Sample Datasets card ── */}
          <div className="panel-card">
            <h2 className="panel-title">📥 Download Sample Datasets</h2>
            <p className="panel-hint">
              Don't have a dataset? Download one of these ready-to-use samples and upload it below.
            </p>
            <div className="sample-datasets-grid">
              {SAMPLE_DATASETS.map((ds) => (
                <div className="sample-card" key={ds.filename}>
                  <div className="sample-card-top">
                    <span className={`sample-badge ${ds.badgeClass}`}>{ds.badge}</span>
                    <h3 className="sample-name">{ds.name}</h3>
                    <p className="sample-desc">{ds.description}</p>
                  </div>
                  <button className="btn btn-secondary btn-sm sample-dl-btn"
                    onClick={() => downloadSample(ds)}>
                    ⬇ Download {ds.filename}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Upload card ── */}
          <div className="panel-card">
            <h2 className="panel-title">Upload Dataset</h2>
            <p className="panel-hint">
              Accepted formats: <strong>.csv</strong>, <strong>.xlsx</strong>, <strong>.xls</strong> · Max 10 MB
            </p>
            <p className="panel-hint">
              Required columns: <code>product_id</code>, <code>warehouse_location</code>, <code>category</code>,
              <code>aisle_number</code>, <code>inventory_level</code>, <code>reorder_point</code>,
              <code>lead_time_days</code>, <code>unit_price</code>, <code>day_of_week</code>,
              <code>month</code>, <code>is_weekend</code>
            </p>

            <div
              className={`drop-zone ${file ? 'has-file' : ''}`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('file-input').click()}
            >
              {file ? (
                <>
                  <span className="drop-icon">📄</span>
                  <p className="drop-filename">{file.name}</p>
                  <p className="drop-size">{(file.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <span className="drop-icon">📂</span>
                  <p>Drag & drop your file here, or click to browse</p>
                </>
              )}
            </div>
            <input id="file-input" type="file" accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }} onChange={handleFile} />

            <button className="btn btn-primary" onClick={handleSubmit}
              disabled={loading || !file}>
              {loading ? 'Running predictions…' : 'Run Predictions'}
            </button>

            {error && (
              <div className="error-box">
                <span>⚠️</span>
                <div>
                  <p>{error}</p>
                  {error.includes('Missing') && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                      Your file must contain the warehouse dataset columns listed above.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Results card ── */}
          {result && (
            <div className="panel-card">
              <div className="result-header-row">
                <h2 className="panel-title">Results — {file?.name}</h2>
                <button className="btn btn-secondary btn-sm" onClick={downloadCSV}>
                  ⬇ Download CSV
                </button>
              </div>

              <div className="stats-row">
                <div className="stat-box">
                  <span className="stat-label">Total Rows</span>
                  <span className="stat-value">{result.total_rows}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Engine</span>
                  <span className="stat-value">🐍 {result.engine}</span>
                </div>
                {result.has_labels && result.metrics && (
                  <>
                    <div className="stat-box">
                      <span className="stat-label">R² Score</span>
                      <span className="stat-value">{result.metrics.r2}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">MAE</span>
                      <span className="stat-value">{result.metrics.mae}</span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">RMSE</span>
                      <span className="stat-value">{result.metrics.rmse}</span>
                    </div>
                  </>
                )}
                {!result.has_labels && (
                  <div className="stat-box">
                    <span className="stat-label">Labels</span>
                    <span className="stat-value" style={{ color: '#f59e0b' }}>Not present</span>
                  </div>
                )}
              </div>

              <h3 className="table-title" style={{ marginTop: '1.5rem' }}>
                Preview (first {result.preview.length} rows)
              </h3>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Predicted Demand</th>
                      {result.has_labels && <th>Actual Demand</th>}
                      {result.has_labels && <th>Abs Error</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.map((r) => (
                      <tr key={r.row}>
                        <td>{r.row}</td>
                        <td><strong>{r.predicted_demand}</strong></td>
                        {result.has_labels && <td>{r.actual_demand}</td>}
                        {result.has_labels && (
                          <td style={{ color: r.error > 20 ? '#ef4444' : '#22c55e' }}>
                            {r.error}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {result.total_rows > 20 && (
                <button className="btn btn-secondary btn-sm"
                  style={{ marginTop: '1rem' }}
                  onClick={() => setShowAll(!showAll)}>
                  {showAll ? 'Show less' : `Show all ${result.total_rows} predictions`}
                </button>
              )}

              {showAll && (
                <div className="table-wrap" style={{ marginTop: '1rem' }}>
                  <table className="data-table">
                    <thead><tr><th>Row</th><th>Predicted Demand</th></tr></thead>
                    <tbody>
                      {result.all_predictions.map((p, i) => (
                        <tr key={i}><td>{i + 1}</td><td>{p}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
