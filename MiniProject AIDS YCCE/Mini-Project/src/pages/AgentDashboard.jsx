import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './AgentDashboard.css'
import { verifyAgentToken, agentLogout } from '../supabaseAuth'

const API = 'http://localhost:5000/api'

// Delivery assignments per agent ID
const ASSIGNMENTS = {
  agent_001: {
    orderId: 'ORD-2024-001',
    item: 'Industrial Conveyor Belt',
    quantity: 2,
    priority: 'High',
    warehouse: { name: 'Warehouse A – Nagpur Central', lat: 21.1458, lng: 79.0882 },
    customer: { name: 'Vikram Industries', phone: '+91 99887 76655', address: 'Plot 45, MIDC, Butibori, Nagpur', lat: 21.0, lng: 79.05 },
  },
  agent_002: {
    orderId: 'ORD-2024-002',
    item: 'Electronic Control Panel',
    quantity: 1,
    priority: 'Critical',
    warehouse: { name: 'Warehouse B – Hingna Road', lat: 21.1, lng: 78.98 },
    customer: { name: 'Sunrise Electronics', phone: '+91 88776 65544', address: '12, Sadar, Nagpur', lat: 21.15, lng: 79.09 },
  },
  agent_003: {
    orderId: 'ORD-2024-003',
    item: 'Grocery Bundle Pack',
    quantity: 50,
    priority: 'Normal',
    warehouse: { name: 'Warehouse C – Kamptee Road', lat: 21.18, lng: 79.12 },
    customer: { name: 'Fresh Mart Store', phone: '+91 77665 54433', address: '88, Dharampeth, Nagpur', lat: 21.13, lng: 79.07 },
  },
}

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Delivered']
const STATUS_COLORS  = { 'Not Started': '#64748b', 'In Progress': '#2563eb', 'Delivered': '#16a34a' }
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'

// Mock AI recommendations based on delivery context
const AI_RECOMMENDATIONS = {
  'Not Started': [
    { type: 'traffic', icon: '🚗', title: 'Traffic Alert', message: 'Light traffic on NH44. Optimal time to start.' },
    { type: 'route', icon: '🛣️', title: 'Route', message: 'Shortest route selected (6.5 km).' },
    { type: 'weather', icon: '☀️', title: 'Weather', message: 'Clear skies. Good visibility for delivery.' },
  ],
  'In Progress': [
    { type: 'traffic', icon: '⚠️', title: 'Traffic Alert', message: 'Moderate traffic detected near NH44. Suggested alternate: Wardha Road.' },
    { type: 'fuel', icon: '⛽', title: 'Fuel', message: 'Estimated fuel usage: 0.3 L. Fuel efficiency: optimal.' },
    { type: 'eta', icon: '⏱️', title: 'ETA Update', message: 'On schedule. Expected delivery in 18 minutes.' },
  ],
  'Delivered': [
    { type: 'success', icon: '✅', title: 'Delivery Complete', message: 'Excellent service! Average delivery time.' },
    { type: 'rating', icon: '⭐', title: 'Rating', message: 'Ready for customer rating and feedback.' },
    { type: 'next', icon: '📋', title: 'Next Delivery', message: 'Next delivery assignment available.' },
  ],
}

export default function AgentDashboard() {
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const directionsRendererRef = useRef(null)
  const agentMarkerRef = useRef(null)
  const watchIdRef = useRef(null)
  const canvasRef = useRef(null)

  const [agent,              setAgent]              = useState(null)
  const [assignment,         setAssignment]         = useState(null)
  const [status,             setStatus]             = useState('Not Started')
  const [mapLoaded,          setMapLoaded]          = useState(false)
  const [routeInfo,          setRouteInfo]          = useState(null)
  const [agentLocation,      setAgentLocation]      = useState(null)
  const [mapError,           setMapError]           = useState(false)
  const [showMap,            setShowMap]            = useState(false)
  const [authChecking,       setAuthChecking]       = useState(true)
  
  // New enhancement states
  const [eta,                setEta]                = useState('25 min')
  const [distanceRemaining,  setDistanceRemaining]  = useState('6.5 km')
  const [aiRecommendation,   setAiRecommendation]   = useState(null)
  const [proofOfDelivery,    setProofOfDelivery]    = useState({ photo: null, signature: null, notes: '' })
  const [showProofForm,      setShowProofForm]      = useState(false)
  const [proofSubmitted,     setProofSubmitted]     = useState(false)
  const [isDrawing,          setIsDrawing]          = useState(false)  // signature pad drawing state

  // ── Validate agent token with backend on every load ───────────────────
  useEffect(() => {
    const token     = localStorage.getItem('agent_token')
    const stored    = localStorage.getItem('delivery_agent')

    // No token or no profile → force login
    if (!token || !stored) {
      navigate('/route-optimization/agent/login')
      return
    }

    // Verify token is a valid JWT issued by our backend
    // and verify agent role is delivery_agent
    verifyAgentToken(token)
      .then((agentData) => {
        // Verify agent has correct role
        if (agentData.role !== 'delivery_agent') {
          console.error('Invalid agent role:', agentData.role)
          agentLogout()
          navigate('/route-optimization/agent/login')
          return
        }

        setAgent(agentData)
        setAssignment(ASSIGNMENTS[agentData.id] || ASSIGNMENTS['agent_001'])

        // Load status from backend first, fall back to localStorage
        try {
          fetch(`${API}/agent/status/${agentData.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(async (res) => {
              if (res.ok) {
                const statusData = await res.json()
                setStatus(statusData.status)
                localStorage.setItem(`status_${agentData.id}`, statusData.status)
              } else {
                const saved = localStorage.getItem(`status_${agentData.id}`)
                if (saved) setStatus(saved)
              }
            })
            .catch(() => {
              // Backend unreachable — use localStorage
              const saved = localStorage.getItem(`status_${agentData.id}`)
              if (saved) setStatus(saved)
            })
        } catch {
          // Token verification failed
          const saved = localStorage.getItem(`status_${agentData.id}`)
          if (saved) setStatus(saved)
        }

        setAuthChecking(false)
      })
      .catch((err) => {
        console.error('Auth verification failed:', err.message)
        // Token is invalid, expired, or role is incorrect
        agentLogout()
        navigate('/route-optimization/agent/login')
      })
  }, [navigate])

  // Load existing proof of delivery from localStorage if already submitted
  useEffect(() => {
    if (!assignment) return
    const saved = localStorage.getItem(`proof_${assignment.orderId}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setProofOfDelivery(parsed)
        setProofSubmitted(true)
        setShowProofForm(true)
      } catch (_) {}
    }
  }, [assignment])

  // Update ETA, Distance, and AI Recommendations when status changes
  useEffect(() => {
    if (!assignment) return

    // Calculate ETA based on status
    const etaMap = {
      'Not Started': '25 min',
      'In Progress': '18 min',
      'Delivered': '0 min',
    }
    setEta(etaMap[status] || '25 min')

    // Calculate distance remaining based on status
    const distanceMap = {
      'Not Started': '6.5 km',
      'In Progress': '4.8 km',
      'Delivered': '0 km',
    }
    setDistanceRemaining(distanceMap[status] || '6.5 km')

    // Get AI recommendations for current status
    const recommendations = AI_RECOMMENDATIONS[status] || AI_RECOMMENDATIONS['Not Started']
    setAiRecommendation(recommendations[Math.floor(Math.random() * recommendations.length)])

    // Show proof of delivery form only when delivered
    if (status === 'Delivered') {
      setShowProofForm(true)
    } else {
      setShowProofForm(false)
      setProofSubmitted(false)
    }
  }, [status, assignment])

  // Broadcast agent location to localStorage (simulates real-time sync for admin panel)
  const broadcastLocation = useCallback((lat, lng, agentId, agentName, currentStatus) => {
    const agents = JSON.parse(localStorage.getItem('live_agents') || '{}')
    agents[agentId] = { ...agents[agentId], id: agentId, name: agentName, lat, lng, status: currentStatus, lastUpdate: Date.now() }
    localStorage.setItem('live_agents', JSON.stringify(agents))
  }, [])

  // Load Google Maps script
  useEffect(() => {
    if (!assignment) return
    if (window.google && window.google.maps) { setMapLoaded(true); return }

    const existing = document.getElementById('gmap-script')
    if (existing) { existing.addEventListener('load', () => setMapLoaded(true)); return }

    const script = document.createElement('script')
    script.id = 'gmap-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setMapLoaded(true)
    script.onerror = () => setMapError(true)
    document.head.appendChild(script)
  }, [assignment])

  // Initialize map once loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !assignment || !showMap) return

    const google = window.google
    const map = new google.maps.Map(mapRef.current, {
      center: assignment.warehouse,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    })
    mapInstanceRef.current = map

    // Warehouse marker
    new google.maps.Marker({
      position: assignment.warehouse,
      map,
      title: assignment.warehouse.name,
      icon: { url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' },
    })

    // Customer marker
    new google.maps.Marker({
      position: assignment.customer,
      map,
      title: assignment.customer.address,
      icon: { url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' },
    })

    // Directions
    const directionsService = new google.maps.DirectionsService()
    const directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true })
    directionsRenderer.setMap(map)
    directionsRendererRef.current = directionsRenderer

    directionsService.route(
      {
        origin: assignment.warehouse,
        destination: assignment.customer,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result)
          const leg = result.routes[0].legs[0]
          setRouteInfo({ distance: leg.distance.text, duration: leg.duration.text })
        }
      }
    )
  }, [mapLoaded, assignment, showMap])

  // Real-time location tracking
  useEffect(() => {
    if (!agent || !assignment) return
    if (!navigator.geolocation) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setAgentLocation({ lat, lng })
        broadcastLocation(lat, lng, agent.id, agent.name, status)

        if (mapInstanceRef.current && window.google) {
          if (agentMarkerRef.current) {
            agentMarkerRef.current.setPosition({ lat, lng })
          } else {
            agentMarkerRef.current = new window.google.maps.Marker({
              position: { lat, lng },
              map: mapInstanceRef.current,
              title: 'Your Location',
              icon: { url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' },
            })
          }
        }
      },
      () => {
        // Fallback: simulate location near warehouse
        if (assignment) {
          const lat = assignment.warehouse.lat + (Math.random() - 0.5) * 0.02
          const lng = assignment.warehouse.lng + (Math.random() - 0.5) * 0.02
          setAgentLocation({ lat, lng })
          broadcastLocation(lat, lng, agent.id, agent.name, status)
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    )

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [agent, assignment, broadcastLocation, status])

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus)
    if (agent) {
      // Save to localStorage immediately (works offline)
      localStorage.setItem(`status_${agent.id}`, newStatus)

      // Save to backend so status survives page refresh
      const token = localStorage.getItem('agent_token')
      fetch(`${API}/agent/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ agent_id: agent.id, status: newStatus }),
      }).catch(() => {}) // silent fail — localStorage is the backup

      if (agentLocation) {
        broadcastLocation(agentLocation.lat, agentLocation.lng, agent.id, agent.name, newStatus)
      }
    }
  }

  const handleStartDelivery = () => {
    setShowMap(true)
    handleStatusChange('In Progress')
    // Open Google Maps for navigation
    if (assignment) {
      const { warehouse, customer } = assignment
      const url = `https://www.google.com/maps/dir/?api=1&origin=${warehouse.lat},${warehouse.lng}&destination=${customer.lat},${customer.lng}&travelmode=driving`
      window.open(url, '_blank')
    }
  }

  // Helper function to open Google Maps navigation in new tab
  const openGoogleMaps = () => {
    if (assignment) {
      const { warehouse, customer } = assignment
      const url = `https://www.google.com/maps/dir/?api=1&origin=${warehouse.lat},${warehouse.lng}&destination=${customer.lat},${customer.lng}&travelmode=driving`
      window.open(url, '_blank')
    }
  }

  // ── Signature pad helpers ────────────────────────────────────────────
  const getCanvasPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const pos = getCanvasPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setIsDrawing(true)
  }

  const draw = (e) => {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const pos = getCanvasPos(e, canvas)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1e293b'
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    // Save signature as data URL
    const canvas = canvasRef.current
    if (canvas) {
      setProofOfDelivery(prev => ({ ...prev, signature: canvas.toDataURL() }))
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    setProofOfDelivery(prev => ({ ...prev, signature: null }))
  }

  // Handle proof of delivery photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProofOfDelivery(prev => ({ ...prev, photo: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle delivery notes
  const handleNotesChange = (e) => {
    setProofOfDelivery(prev => ({ ...prev, notes: e.target.value }))
  }

  // Submit proof of delivery
  const handleSubmitProof = () => {
    if (!proofOfDelivery.notes.trim()) {
      alert('Please add delivery notes before submitting.')
      return
    }
    // Store proof in localStorage (persists without backend)
    const proof = {
      ...proofOfDelivery,
      timestamp: new Date().toISOString(),
      orderId: assignment.orderId,
      agentId: agent.id,
    }
    localStorage.setItem(`proof_${assignment.orderId}`, JSON.stringify(proof))
    setProofSubmitted(true)
  }

  const handleLogout = async () => {
    // Clean up live agents tracking
    if (agent) {
      const agents = JSON.parse(localStorage.getItem('live_agents') || '{}')
      delete agents[agent.id]
      localStorage.setItem('live_agents', JSON.stringify(agents))
    }
    
    // Clear all agent authentication data
    await agentLogout()
    
    // Redirect to login page
    navigate('/route-optimization/agent/login')
  }

  if (authChecking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <p style={{ color: '#64748b', fontSize: '1rem' }}>Verifying session…</p>
    </div>
  )

  if (!agent || !assignment) return null

  return (
    <div className="agent-dash">
      {/* Header */}
      <div className="agent-dash-header">
        <div className="agent-dash-header-inner">
          <div className="agent-info">
            <span className="agent-avatar">🚚</span>
            <div>
              <div className="agent-name">{agent.name}</div>
              <div className="agent-phone">{agent.phone}</div>
            </div>
          </div>
          <div className="agent-header-right">
            <span className="status-badge" style={{ background: STATUS_COLORS[status] + '22', color: STATUS_COLORS[status], border: `1px solid ${STATUS_COLORS[status]}44` }}>
              {status}
            </span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>

      <div className="agent-dash-body">
        {/* ETA & Distance Cards */}
        <div className="delivery-metrics">
          <div className="metric-card eta-card">
            <div className="metric-icon">⏱️</div>
            <div className="metric-content">
              <div className="metric-label">Estimated Arrival</div>
              <div className="metric-value">{status === 'Delivered' ? '✅ Done' : eta}</div>
              <div className="metric-sub">{status === 'Delivered' ? 'Completed' : status === 'Not Started' ? 'Pending Start' : 'On Schedule'}</div>
            </div>
          </div>
          <div className="metric-card distance-card">
            <div className="metric-icon">📍</div>
            <div className="metric-content">
              <div className="metric-label">Distance Remaining</div>
              <div className="metric-value">{distanceRemaining}</div>
              <div className="metric-sub">{status === 'Delivered' ? 'Delivered' : `Approx. ${eta} drive`}</div>
            </div>
          </div>
        </div>

        {/* Open Google Maps Button (New Enhancement) */}
        {status !== 'Not Started' && (
          <div className="agent-section">
            <button className="btn-google-maps" onClick={openGoogleMaps}>
              🗺️ Open Navigation in Google Maps
            </button>
          </div>
        )}

        {/* Delivery Timeline (New Enhancement) */}
        <div className="agent-section">
          <h2 className="section-title">📋 Delivery Timeline</h2>
          <div className="delivery-timeline">
            <div className={`timeline-step ${status === 'Delivered' || status === 'In Progress' ? 'completed' : ''}`}>
              <div className="timeline-marker">✓</div>
              <div className="timeline-label">Order Assigned</div>
            </div>
            <div className="timeline-connector"></div>
            <div className={`timeline-step ${status === 'Delivered' || status === 'In Progress' ? 'completed' : ''}`}>
              <div className="timeline-marker">✓</div>
              <div className="timeline-label">Picked From Warehouse</div>
            </div>
            <div className="timeline-connector"></div>
            <div className={`timeline-step ${status === 'In Progress' ? 'active' : status === 'Delivered' ? 'completed' : ''}`}>
              <div className="timeline-marker">{status === 'Delivered' ? '✓' : status === 'In Progress' ? '🟡' : '⬜'}</div>
              <div className="timeline-label">On The Way</div>
            </div>
            <div className="timeline-connector"></div>
            <div className={`timeline-step ${status === 'Delivered' ? 'completed' : ''}`}>
              <div className="timeline-marker">{status === 'Delivered' ? '✓' : '⬜'}</div>
              <div className="timeline-label">Delivered</div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="agent-section">
          <h2 className="section-title">📦 Order Details</h2>
          <div className="info-grid">
            <div className="info-card">
              <span className="info-label">Order ID</span>
              <span className="info-value">{assignment.orderId}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Item</span>
              <span className="info-value">{assignment.item}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Quantity</span>
              <span className="info-value">{assignment.quantity}</span>
            </div>
            <div className="info-card priority">
              <span className="info-label">Priority</span>
              <span className={`priority-badge priority-${assignment.priority.toLowerCase()}`}>{assignment.priority}</span>
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="agent-section">
          <h2 className="section-title">📍 Locations</h2>
          <div className="location-cards">
            <div className="location-card location-card--warehouse">
              <div className="location-icon">🏭</div>
              <div>
                <div className="location-label">Pickup Warehouse</div>
                <div className="location-name">{assignment.warehouse.name}</div>
              </div>
            </div>
            <div className="location-arrow">→</div>
            <div className="location-card location-card--customer">
              <div className="location-icon">📬</div>
              <div>
                <div className="location-label">Delivery Address</div>
                <div className="location-name">{assignment.customer.address}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="agent-section">
          <h2 className="section-title">👤 Customer Details</h2>
          <div className="info-grid">
            <div className="info-card">
              <span className="info-label">Name</span>
              <span className="info-value">{assignment.customer.name}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Phone</span>
              <span className="info-value">
                <a href={`tel:${assignment.customer.phone}`} className="phone-link">{assignment.customer.phone}</a>
              </span>
            </div>
            <div className="info-card info-card--full">
              <span className="info-label">Address</span>
              <span className="info-value">{assignment.customer.address}</span>
            </div>
          </div>
        </div>

        {/* Route Info */}
        {routeInfo && (
          <div className="agent-section">
            <h2 className="section-title">🗺️ Route Info</h2>
            <div className="route-stats">
              <div className="route-stat">
                <span className="route-stat-icon">📏</span>
                <span className="route-stat-label">Distance</span>
                <span className="route-stat-value">{routeInfo.distance}</span>
              </div>
              <div className="route-stat">
                <span className="route-stat-icon">⏱️</span>
                <span className="route-stat-label">Est. Time</span>
                <span className="route-stat-value">{routeInfo.duration}</span>
              </div>
              {agentLocation && (
                <div className="route-stat">
                  <span className="route-stat-icon">📡</span>
                  <span className="route-stat-label">GPS</span>
                  <span className="route-stat-value">Active</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Route Recommendation */}
        {aiRecommendation && (
          <div className="agent-section ai-recommendation">
            <h2 className="section-title">🤖 AI Route Recommendation</h2>
            <div className="ai-rec-grid">
              <div className="ai-rec-row">
                <span className="ai-rec-label">🚗 Current Traffic</span>
                <span className="ai-rec-val ai-rec-moderate">
                  {status === 'Not Started' ? 'Light' : status === 'In Progress' ? 'Moderate' : 'N/A'}
                </span>
              </div>
              <div className="ai-rec-row">
                <span className="ai-rec-label">🛣️ Suggested Route</span>
                <span className="ai-rec-val">{aiRecommendation.title === 'Route' ? aiRecommendation.message : 'Wardha Road (Optimal)'}</span>
              </div>
              <div className="ai-rec-row">
                <span className="ai-rec-label">⏱️ Time Saved</span>
                <span className="ai-rec-val ai-rec-green">
                  {status === 'Not Started' ? '~6 min' : status === 'In Progress' ? '~4 min' : '—'}
                </span>
              </div>
              <div className="ai-rec-row">
                <span className="ai-rec-label">⛽ Fuel Saved</span>
                <span className="ai-rec-val ai-rec-green">
                  {status === 'Delivered' ? '0.3 L saved' : '~0.3 L'}
                </span>
              </div>
              <div className="ai-rec-row">
                <span className="ai-rec-label">🎯 AI Confidence</span>
                <span className="ai-rec-val ai-rec-blue">94%</span>
              </div>
              <div className="ai-rec-row ai-rec-row--full">
                <span className="ai-rec-label">{aiRecommendation.icon} Note</span>
                <span className="ai-rec-val">{aiRecommendation.message}</span>
              </div>
            </div>
          </div>
        )}

        {/* Start Delivery Button */}
        {status === 'Not Started' && (
          <div className="agent-section">
            <button className="btn-start-delivery" onClick={handleStartDelivery}>
              🚀 Start Delivery
            </button>
          </div>
        )}

        {/* Status Update */}
        <div className="agent-section">
          <h2 className="section-title">🔄 Update Status</h2>
          <div className="status-buttons">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                className={`status-btn ${status === s ? 'active' : ''}`}
                style={status === s ? { background: STATUS_COLORS[s], color: '#fff', borderColor: STATUS_COLORS[s] } : {}}
                onClick={() => handleStatusChange(s)}
              >
                {s === 'Not Started' ? '⚫' : s === 'In Progress' ? '🔵' : '🟢'} {s}
              </button>
            ))}
          </div>
        </div>

        {/* Proof of Delivery — only when Delivered */}
        {showProofForm && (
          <div className="agent-section proof-section">
            <h2 className="section-title">📸 Proof of Delivery</h2>
            {proofSubmitted ? (
              <div className="proof-success">
                <div className="proof-success-icon">✅</div>
                <div className="proof-success-text">Delivery completed successfully.</div>
                <div className="proof-success-details">
                  <div>Order: {assignment.orderId}</div>
                  <div>Submitted: {proofOfDelivery.timestamp ? new Date(proofOfDelivery.timestamp).toLocaleString() : new Date().toLocaleString()}</div>
                </div>
                {/* Show submitted photo if available */}
                {proofOfDelivery.photo && (
                  <img src={proofOfDelivery.photo} alt="Delivery proof" className="proof-submitted-photo" />
                )}
                {/* Show submitted signature if available */}
                {proofOfDelivery.signature && (
                  <div className="proof-submitted-sig">
                    <div className="proof-sig-label">Customer Signature</div>
                    <img src={proofOfDelivery.signature} alt="Signature" className="proof-sig-img" />
                  </div>
                )}
                {proofOfDelivery.notes && (
                  <div className="proof-submitted-notes">
                    <strong>Notes:</strong> {proofOfDelivery.notes}
                  </div>
                )}
              </div>
            ) : (
              <div className="proof-form">

                {/* Photo Upload */}
                <div className="form-group">
                  <label className="form-label">📷 Upload Delivery Photo</label>
                  <div className="photo-upload">
                    {proofOfDelivery.photo ? (
                      <div className="photo-preview">
                        <img src={proofOfDelivery.photo} alt="Delivery proof" />
                        <button
                          type="button"
                          className="btn-clear-photo"
                          onClick={() => setProofOfDelivery(prev => ({ ...prev, photo: null }))}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ) : (
                      <label className="photo-input-label">
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                        <span className="upload-icon">📁</span>
                        <span className="upload-text">Click to upload delivery photo</span>
                        <span className="upload-hint">Optional — screenshot or camera photo</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Signature Pad */}
                <div className="form-group">
                  <label className="form-label">✍️ Customer Signature</label>
                  <div className="signature-pad-wrap">
                    <canvas
                      ref={canvasRef}
                      className="signature-canvas"
                      width={480}
                      height={120}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    <button type="button" className="btn-clear-sig" onClick={clearSignature}>
                      Clear
                    </button>
                  </div>
                  <p className="sig-hint">Ask the customer to sign above using mouse or touch</p>
                </div>

                {/* Delivery Notes */}
                <div className="form-group">
                  <label className="form-label">📝 Delivery Notes <span className="required-star">*</span></label>
                  <textarea
                    className="form-textarea"
                    placeholder="e.g. Delivered to reception. Received by: John Doe."
                    value={proofOfDelivery.notes}
                    onChange={handleNotesChange}
                    rows={3}
                  />
                </div>

                {/* Submit */}
                <button className="btn-submit-proof" onClick={handleSubmitProof}>
                  ✅ Submit Delivery
                </button>

              </div>
            )}
          </div>
        )}

        {/* Map */}
        {showMap && (
          <div className="agent-section">
            <h2 className="section-title">🗺️ Live Map</h2>
            {mapError ? (
              <div className="map-fallback-card">
                <div className="map-fallback-header">
                  <span className="map-fallback-icon">🗺️</span>
                  <div>
                    <div className="map-fallback-title">Route Overview</div>
                    <div className="map-fallback-note">Google Maps unavailable in demo mode</div>
                  </div>
                </div>
                <div className="map-fallback-details">
                  <div className="map-fallback-row">
                    <span>🏭 Warehouse</span>
                    <strong>{assignment.warehouse.name}</strong>
                  </div>
                  <div className="map-fallback-arrow">↓</div>
                  <div className="map-fallback-row">
                    <span>📬 Customer</span>
                    <strong>{assignment.customer.address}</strong>
                  </div>
                  <div className="map-fallback-row map-fallback-row--stats">
                    <span>📏 Distance: <strong>{distanceRemaining}</strong></span>
                    <span>⏱️ ETA: <strong>{eta}</strong></span>
                  </div>
                </div>
                <a
                  className="btn-open-gmaps"
                  href={`https://www.google.com/maps/dir/?api=1&origin=${assignment.warehouse.lat},${assignment.warehouse.lng}&destination=${assignment.customer.lat},${assignment.customer.lng}&travelmode=driving`}
                  target="_blank"
                  rel="noreferrer"
                >
                  🗺️ Open Route in Google Maps ↗
                </a>
              </div>
            ) : (
              <div ref={mapRef} className="agent-map" />
            )}
          </div>
        )}

        {!showMap && status === 'In Progress' && (
          <div className="agent-section">
            <button className="btn-show-map" onClick={() => setShowMap(true)}>
              🗺️ Show Map
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
