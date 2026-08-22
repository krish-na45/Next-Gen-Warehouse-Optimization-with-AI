import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import './AdminTracking.css'

const API = 'http://localhost:5000/api'
const getToken = () => localStorage.getItem('token')
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'

const STATUS_COLORS = { 'Not Started': '#64748b', 'In Progress': '#2563eb', 'Delivered': '#16a34a' }
const STATUS_ICONS  = { 'Not Started': '⚫', 'In Progress': '🔵', 'Delivered': '🟢' }

// Fetch helper — uses manager token for auth
async function apiFetch(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export default function AdminTracking() {
  const mapRef              = useRef(null)
  const mapInstanceRef      = useRef(null)
  const markersRef          = useRef({})
  const infoWindowRef       = useRef(null)

  const [agents,         setAgents]         = useState([])
  const [stats,          setStats]          = useState({ total: 0, active: 0, completed: 0, pending: 0 })
  const [filter,         setFilter]         = useState('All')
  const [selectedAgent,  setSelectedAgent]  = useState(null)
  const [orderDetail,    setOrderDetail]    = useState(null)   // full detail for selected agent
  const [loadingDetail,  setLoadingDetail]  = useState(false)
  const [mapLoaded,      setMapLoaded]      = useState(false)
  const [mapError,       setMapError]       = useState(false)
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')
  const [lastUpdated,    setLastUpdated]    = useState(null)

  // ── Fetch dashboard from backend ─────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    try {
      const data = await apiFetch('/agent/company/dashboard')
      setAgents(data.agents)
      setStats(data.stats)
      setLastUpdated(new Date())
      setError('')
    } catch (err) {
      setError('Cannot reach backend. Make sure the server is running on port 5000.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch + poll every 5 seconds
  useEffect(() => {
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 5000)
    return () => clearInterval(interval)
  }, [fetchDashboard])

  // Refresh selected agent detail when agents update
  useEffect(() => {
    if (selectedAgent) {
      const updated = agents.find(a => a.id === selectedAgent.id)
      if (updated) setSelectedAgent(updated)
    }
  }, [agents])

  // ── Load full order detail for selected agent ─────────────────────────
  const loadOrderDetail = useCallback(async (agentId) => {
    setLoadingDetail(true)
    setOrderDetail(null)
    try {
      const data = await apiFetch(`/agent/company/order/${agentId}`)
      setOrderDetail(data)
    } catch {
      setOrderDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  const handleSelectAgent = (agent) => {
    setSelectedAgent(agent)
    loadOrderDetail(agent.id)
    if (mapInstanceRef.current && window.google) {
      mapInstanceRef.current.panTo({ lat: agent.lat, lng: agent.lng })
      mapInstanceRef.current.setZoom(14)
    }
  }

  // ── Google Maps ───────────────────────────────────────────────────────
  useEffect(() => {
    if (window.google?.maps) { setMapLoaded(true); return }
    const existing = document.getElementById('gmap-script')
    if (existing) { existing.addEventListener('load', () => setMapLoaded(true)); return }
    const script = document.createElement('script')
    script.id = 'gmap-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true; script.defer = true
    script.onload  = () => setMapLoaded(true)
    script.onerror = () => setMapError(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const google = window.google
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 21.145, lng: 79.08 }, zoom: 12,
      mapTypeControl: false, streetViewControl: false,
    })
    mapInstanceRef.current = map
    infoWindowRef.current  = new google.maps.InfoWindow()
  }, [mapLoaded])

  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !window.google) return
    const google = window.google
    agents.forEach((agent) => {
      const pos     = { lat: agent.lat, lng: agent.lng }
      const dotColor = agent.status === 'In Progress' ? 'blue'
                     : agent.status === 'Delivered'   ? 'green' : 'yellow'
      const iconUrl  = `https://maps.google.com/mapfiles/ms/icons/${dotColor}-dot.png`

      if (markersRef.current[agent.id]) {
        markersRef.current[agent.id].setPosition(pos)
        markersRef.current[agent.id].setIcon({ url: iconUrl })
      } else {
        const marker = new google.maps.Marker({
          position: pos, map: mapInstanceRef.current,
          title: agent.name, icon: { url: iconUrl },
        })
        marker.addListener('click', () => {
          handleSelectAgent(agent)
          infoWindowRef.current.setContent(`
            <div style="padding:8px;min-width:180px">
              <strong>${agent.name}</strong><br/>
              <span style="color:${STATUS_COLORS[agent.status]}">${STATUS_ICONS[agent.status]} ${agent.status}</span><br/>
              <small>${agent.route}</small><br/>
              <small>ETA: ${agent.eta}</small>
            </div>
          `)
          infoWindowRef.current.open(mapInstanceRef.current, marker)
        })
        markersRef.current[agent.id] = marker
      }
    })
  }, [agents])

  useEffect(() => { updateMarkers() }, [updateMarkers])

  const filteredAgents = filter === 'All' ? agents : agents.filter(a => a.status === filter)

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="admin-track">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand">
            <span>🏢</span>
            <div>
              <div className="admin-title">Company Dashboard</div>
              <div className="admin-subtitle">
                Live Delivery Tracking
                {lastUpdated && (
                  <span className="last-updated"> · Updated {lastUpdated.toLocaleTimeString()}</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="btn-back-admin" onClick={fetchDashboard} title="Refresh now">🔄</button>
            <Link to="/route-optimization" className="btn-back-admin">← Back</Link>
          </div>
        </div>
      </div>

      <div className="admin-body">
        {/* Error banner */}
        {error && (
          <div className="admin-error-banner">⚠️ {error}</div>
        )}

        {/* Stats — from backend */}
        <div className="admin-stats">
          {[
            { label: 'Total',     value: stats.total,     icon: '📦', color: '#2563eb'  },
            { label: 'Active',    value: stats.active,    icon: '🔵', color: '#2563eb'  },
            { label: 'Completed', value: stats.completed, icon: '🟢', color: '#16a34a'  },
            { label: 'Pending',   value: stats.pending,   icon: '⚫', color: '#64748b'  },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <span className="stat-icon">{s.icon}</span>
              <span className="stat-value" style={{ color: s.color }}>
                {loading ? '—' : s.value}
              </span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="admin-main">
          {/* Left: Agent List */}
          <div className="admin-sidebar">
            <div className="filter-bar">
              {['All', 'In Progress', 'Not Started', 'Delivered'].map((f) => (
                <button
                  key={f}
                  className={`filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'In Progress' ? '🔵' : f === 'Not Started' ? '⚫' : f === 'Delivered' ? '🟢' : '📋'} {f}
                </button>
              ))}
            </div>

            <div className="agent-list">
              {loading ? (
                <div className="no-agents">Loading agents…</div>
              ) : filteredAgents.length === 0 ? (
                <div className="no-agents">No agents with status "{filter}"</div>
              ) : filteredAgents.map((agent) => (
                <div
                  key={agent.id}
                  className={`agent-list-card ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
                  onClick={() => handleSelectAgent(agent)}
                >
                  <div className="agent-list-top">
                    <span className="agent-list-name">{agent.name}</span>
                    <span className="agent-list-status" style={{ color: STATUS_COLORS[agent.status] }}>
                      {STATUS_ICONS[agent.status]} {agent.status}
                    </span>
                  </div>
                  <div className="agent-list-route">{agent.route}</div>
                  {agent.status === 'In Progress' && (
                    <div className="agent-progress-bar">
                      <div className="agent-progress-fill" style={{ width: `${agent.progress}%` }} />
                    </div>
                  )}
                  <div className="agent-list-meta">
                    <span>{agent.orderId}</span>
                    <span>ETA: {agent.eta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Map + Detail */}
          <div className="admin-map-area">
            {mapError ? (
              <div className="map-fallback-full">
                <div className="map-fallback-header-bar">
                  <span>🗺️ Delivery Location Overview</span>
                  <span className="map-fallback-badge">Demo Mode — Maps API key required</span>
                </div>
                <div className="map-agent-table">
                  <div className="map-table-head">
                    <span>Agent</span><span>Status</span><span>Order</span><span>ETA</span><span>Navigate</span>
                  </div>
                  {agents.map(agent => {
                    const order = agent // route/distance come from dashboard API
                    return (
                      <div
                        key={agent.id}
                        className={`map-table-row ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
                        onClick={() => handleSelectAgent(agent)}
                      >
                        <span className="map-table-name">{agent.name}</span>
                        <span style={{ color: STATUS_COLORS[agent.status], fontWeight: 600, fontSize: '0.82rem' }}>
                          {STATUS_ICONS[agent.status]} {agent.status}
                        </span>
                        <span className="map-table-order">{agent.orderId}</span>
                        <span style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.82rem' }}>{agent.eta}</span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${agent.lat},${agent.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="map-table-link"
                          onClick={e => e.stopPropagation()}
                        >
                          ↗
                        </a>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div ref={mapRef} className="admin-map" />
            )}

            {/* Agent Detail Panel — loaded from backend */}
            {selectedAgent && (
              <div className="agent-detail-panel">
                <div className="agent-detail-header">
                  <span className="agent-detail-name">{selectedAgent.name}</span>
                  <button className="agent-detail-close" onClick={() => { setSelectedAgent(null); setOrderDetail(null) }}>✕</button>
                </div>

                {loadingDetail ? (
                  <div className="agent-detail-body">
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading order details…</p>
                  </div>
                ) : orderDetail ? (
                  <div className="agent-detail-body">
                    {/* Status */}
                    <div className="detail-row">
                      <span>Status</span>
                      <span style={{ color: STATUS_COLORS[orderDetail.status], fontWeight: 700 }}>
                        {STATUS_ICONS[orderDetail.status]} {orderDetail.status}
                      </span>
                    </div>

                    {/* Order */}
                    <div className="detail-row">
                      <span>Order ID</span>
                      <span>{orderDetail.order?.orderId}</span>
                    </div>
                    <div className="detail-row">
                      <span>Item</span>
                      <span>{orderDetail.order?.item} (×{orderDetail.order?.quantity})</span>
                    </div>
                    <div className="detail-row">
                      <span>Priority</span>
                      <span style={{ color: orderDetail.order?.priority === 'Critical' ? '#dc2626' : orderDetail.order?.priority === 'High' ? '#d97706' : '#16a34a' }}>
                        {orderDetail.order?.priority}
                      </span>
                    </div>

                    {/* Route */}
                    <div className="detail-row">
                      <span>From</span>
                      <span>{orderDetail.order?.warehouse?.name}</span>
                    </div>
                    <div className="detail-row">
                      <span>To</span>
                      <span>{orderDetail.order?.customer?.address}</span>
                    </div>
                    <div className="detail-row">
                      <span>Route</span>
                      <span>{orderDetail.order?.route}</span>
                    </div>
                    <div className="detail-row">
                      <span>Distance</span>
                      <span>{orderDetail.order?.distance}</span>
                    </div>

                    {/* ETA & Progress */}
                    <div className="detail-row">
                      <span>ETA</span>
                      <span style={{ color: '#2563eb', fontWeight: 700 }}>{orderDetail.eta}</span>
                    </div>
                    <div className="detail-row">
                      <span>Progress</span>
                      <span>{orderDetail.progress}%</span>
                    </div>
                    {/* Mini progress bar */}
                    <div className="detail-progress-bar">
                      <div className="detail-progress-fill" style={{ width: `${orderDetail.progress}%` }} />
                    </div>

                    {/* Delivery Timeline */}
                    <div className="detail-section-title">📋 Delivery Timeline</div>
                    <div className="detail-timeline">
                      {['Order Assigned', 'Picked Up', 'On The Way', 'Delivered'].map((stage, i) => {
                        const stageIdx = orderDetail.status === 'Not Started' ? 0
                                       : orderDetail.status === 'In Progress'  ? 2
                                       : 3
                        const done   = i <= stageIdx
                        const active = i === stageIdx && orderDetail.status !== 'Delivered'
                        return (
                          <div key={stage} className={`dtl-step ${done ? 'dtl-done' : ''} ${active ? 'dtl-active' : ''}`}>
                            <div className="dtl-dot">{done && !active ? '✓' : active ? '●' : '○'}</div>
                            <div className="dtl-label">{stage}</div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Customer */}
                    <div className="detail-row">
                      <span>Customer</span>
                      <span>{orderDetail.order?.customer?.name}</span>
                    </div>
                    <div className="detail-row">
                      <span>Cust. Phone</span>
                      <span>{orderDetail.order?.customer?.phone}</span>
                    </div>

                    {/* AI Insight */}
                    {orderDetail.ai && (
                      <>
                        <div className="detail-section-title">🤖 AI Insight</div>
                        <div className="detail-row">
                          <span>Traffic</span>
                          <span style={{ color: orderDetail.ai.traffic === 'Moderate' ? '#d97706' : '#16a34a' }}>
                            {orderDetail.ai.traffic}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span>Suggested Route</span>
                          <span>{orderDetail.ai.route}</span>
                        </div>
                        <div className="detail-row">
                          <span>Time Saved</span>
                          <span style={{ color: '#16a34a' }}>{orderDetail.ai.timeSaved}</span>
                        </div>
                        <div className="detail-row">
                          <span>Confidence</span>
                          <span style={{ color: '#2563eb' }}>{orderDetail.ai.confidence}</span>
                        </div>
                        <div className="detail-ai-note">{orderDetail.ai.note}</div>
                      </>
                    )}

                    {/* Proof of Delivery */}
                    {orderDetail.proof && (
                      <>
                        <div className="detail-section-title">📸 Proof of Delivery</div>
                        {orderDetail.proof.photo && (
                          <img src={orderDetail.proof.photo} alt="Proof" className="detail-proof-photo" />
                        )}
                        {orderDetail.proof.notes && (
                          <div className="detail-row">
                            <span>Notes</span>
                            <span>{orderDetail.proof.notes}</span>
                          </div>
                        )}
                        <div className="detail-row">
                          <span>Submitted</span>
                          <span>{new Date(orderDetail.proof.timestamp).toLocaleString()}</span>
                        </div>
                      </>
                    )}

                    {/* Open in Maps */}
                    {orderDetail.order && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${orderDetail.order.warehouseLat},${orderDetail.order.warehouseLng}&destination=${orderDetail.order.customerLat},${orderDetail.order.customerLng}&travelmode=driving`}
                        target="_blank"
                        rel="noreferrer"
                        className="detail-maps-btn"
                      >
                        🗺️ Open Route in Google Maps ↗
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="agent-detail-body">
                    <div className="detail-row">
                      <span>Status</span>
                      <span style={{ color: STATUS_COLORS[selectedAgent.status], fontWeight: 700 }}>
                        {STATUS_ICONS[selectedAgent.status]} {selectedAgent.status}
                      </span>
                    </div>
                    <div className="detail-row"><span>ETA</span><span>{selectedAgent.eta}</span></div>
                    <div className="detail-row"><span>Route</span><span>{selectedAgent.route}</span></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
