import { useState } from 'react'
import { Link } from 'react-router-dom'
import './PublicDeliveryTracker.css'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MOCK ORDER DATA - Demo orders for testing
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Future Integration Points:
 * 1. Replace MOCK_ORDERS with API call to /api/track-order/:orderId
 * 2. Connect to real Agent Dashboard for live GPS tracking
 * 3. Integrate with Google Maps for real-time route visualization
 * 4. Add WebSocket for live status updates
 */
const MOCK_ORDERS = {
  'ORD-2024-001': {
    orderId: 'ORD-2024-001',
    customerName: 'Rajesh Kumar',
    agentName: 'Rahul Sharma',
    agentContact: '+91 9876543210',
    status: 'In Progress', // Not Started, In Progress, Delivered
    eta: '2:45 PM',
    routeSummary: 'Warehouse A → Butibori MIDC → Customer Location',
    orderCost: '₹845.00',
    warehouseName: 'Warehouse A - Central Hub',
    destinationName: 'Butibori MIDC, Nagpur',
    // Tracking timeline stages with timestamps
    timeline: [
      { stage: 'Order Received', completed: true, time: '09:30 AM' },
      { stage: 'Packed', completed: true, time: '10:15 AM' },
      { stage: 'Out For Delivery', completed: true, time: '11:00 AM' },
      { stage: 'Delivered', completed: false, time: 'Pending' },
    ],
  },
  'ORD-2024-002': {
    orderId: 'ORD-2024-002',
    customerName: 'Priya Patel',
    agentName: 'Amit Kumar',
    agentContact: '+91 9123456789',
    status: 'Not Started',
    eta: '4:30 PM',
    routeSummary: 'Warehouse B → Sadar → Customer Location',
    orderCost: '₹1,250.50',
    warehouseName: 'Warehouse B - East Division',
    destinationName: 'Sadar, Nagpur',
    timeline: [
      { stage: 'Order Received', completed: true, time: '10:00 AM' },
      { stage: 'Packed', completed: false, time: 'In Progress' },
      { stage: 'Out For Delivery', completed: false, time: 'Pending' },
      { stage: 'Delivered', completed: false, time: 'Pending' },
    ],
  },
  'ORD-2024-003': {
    orderId: 'ORD-2024-003',
    customerName: 'Neha Singh',
    agentName: 'Priya Patel',
    agentContact: '+91 9987654321',
    status: 'Delivered',
    eta: 'Delivered',
    routeSummary: 'Warehouse C → Dharampeth → Customer Location',
    orderCost: '₹2,100.00',
    warehouseName: 'Warehouse C - Premium Division',
    destinationName: 'Dharampeth, Nagpur',
    timeline: [
      { stage: 'Order Received', completed: true, time: '08:00 AM' },
      { stage: 'Packed', completed: true, time: '08:45 AM' },
      { stage: 'Out For Delivery', completed: true, time: '09:30 AM' },
      { stage: 'Delivered', completed: true, time: '01:15 PM' },
    ],
  },
}

/**
 * Status Badge Component - displays colored status indicators
 * Colors: Not Started (Gray), In Progress (Blue), Delivered (Green)
 */
function StatusBadge({ status }) {
  const statusColors = {
    'Not Started': { bg: '#e2e8f0', text: '#64748b', label: 'Not Started' },
    'In Progress': { bg: '#dbeafe', text: '#2563eb', label: 'In Progress' },
    'Delivered': { bg: '#dcfce7', text: '#16a34a', label: 'Delivered' },
  }

  const statusIcons = {
    'Not Started': '⚫',
    'In Progress': '🔵',
    'Delivered': '🟢',
  }

  const config = statusColors[status] || statusColors['Not Started']

  return (
    <span
      className="status-badge"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      <span className="status-icon">{statusIcons[status]}</span>
      {config.label}
    </span>
  )
}

/**
 * Delivery Timeline Component - visual progress indicator
 * Shows: Order Received → Packed → Out For Delivery → Delivered
 * Highlights current stage based on order status
 */
function DeliveryTimeline({ timeline }) {
  return (
    <div className="timeline-container">
      <div className="timeline-track">
        {timeline.map((item, idx) => {
          const isLast = idx === timeline.length - 1
          return (
            <div key={idx} className="timeline-step">
              {/* Step Circle */}
              <div
                className={`timeline-circle ${item.completed ? 'completed' : 'pending'}`}
              >
                {item.completed ? '✓' : idx + 1}
              </div>

              {/* Connecting Line (except for last item) */}
              {!isLast && (
                <div
                  className={`timeline-line ${item.completed ? 'completed' : ''}`}
                />
              )}

              {/* Step Label */}
              <div className="timeline-label">
                <div className="timeline-stage">{item.stage}</div>
                <div className="timeline-time">{item.time}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Tracking Card Component - displays detailed order information
 * Shows customer, agent, route, and timeline data
 */
function TrackingCard({ order }) {
  return (
    <div className="tracking-card">
      {/* Header with Order ID and Status */}
      <div className="tracking-header">
        <div>
          <h3 className="tracking-title">Order #{order.orderId}</h3>
          <p className="tracking-subtitle">Real-time Delivery Tracking</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Order Details Grid */}
      <div className="tracking-details">
        {/* Left Column: Customer & Agent Info */}
        <div className="detail-column">
          <div className="detail-group">
            <span className="detail-icon">👤</span>
            <div>
              <div className="detail-label">Customer Name</div>
              <div className="detail-value">{order.customerName}</div>
            </div>
          </div>

          <div className="detail-group">
            <span className="detail-icon">🚗</span>
            <div>
              <div className="detail-label">Delivery Agent</div>
              <div className="detail-value">{order.agentName}</div>
            </div>
          </div>

          <div className="detail-group">
            <span className="detail-icon">📞</span>
            <div>
              <div className="detail-label">Agent Contact</div>
              <div className="detail-value">{order.agentContact}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Route & Cost Info */}
        <div className="detail-column">
          <div className="detail-group">
            <span className="detail-icon">📍</span>
            <div>
              <div className="detail-label">Destination</div>
              <div className="detail-value">{order.destinationName}</div>
            </div>
          </div>

          <div className="detail-group">
            <span className="detail-icon">🏢</span>
            <div>
              <div className="detail-label">Warehouse</div>
              <div className="detail-value">{order.warehouseName}</div>
            </div>
          </div>

          <div className="detail-group">
            <span className="detail-icon">💰</span>
            <div>
              <div className="detail-label">Order Cost</div>
              <div className="detail-value">{order.orderCost}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Route Summary & ETA */}
      <div className="route-info">
        <div className="route-summary">
          <span className="route-icon">🗺️</span>
          <div>
            <div className="route-label">Route Summary</div>
            <div className="route-value">{order.routeSummary}</div>
          </div>
        </div>
        <div className="eta-box">
          <div className="eta-label">Estimated Arrival</div>
          <div className="eta-value">{order.eta}</div>
        </div>
      </div>

      {/* Delivery Timeline */}
      <div className="timeline-section">
        <h4 className="timeline-heading">📊 Delivery Progress</h4>
        <DeliveryTimeline timeline={order.timeline} />
      </div>

      {/* Future Integration Notice */}
      <div className="integration-notice">
        <span className="notice-icon">🔗</span>
        <span className="notice-text">
          Future: Click here for live GPS tracking and real-time updates
        </span>
      </div>
    </div>
  )
}

/**
 * Main Public Delivery Tracker Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tracking Logic:
 * 1. User enters Order ID in search box
 * 2. Lookup in MOCK_ORDERS (will be replaced with API call)
 * 3. If found: display TrackingCard with all details
 * 4. If not found: show error message
 * 
 * Future Integration Points:
 * - Connect to backend /api/track-order/:orderId endpoint
 * - Add real-time WebSocket updates for status changes
 * - Integrate Google Maps for route visualization
 * - Link to Agent Dashboard for live tracking
 * - Add SMS/Email notifications
 */
export default function PublicDeliveryTracker() {
  const [searchInput, setSearchInput] = useState('')
  const [trackedOrder, setTrackedOrder] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  /**
   * Handle order search - looks up order in MOCK_ORDERS
   * Future: Replace with API call to backend tracking service
   */
  const handleTrack = (e) => {
    e.preventDefault()
    const orderId = searchInput.trim().toUpperCase()

    if (!orderId) {
      setErrorMessage('Please enter an Order ID')
      setTrackedOrder(null)
      return
    }

    // Tracking logic: lookup order in mock data
    // FUTURE INTEGRATION: Replace with API call
    // const response = await fetch(`/api/track-order/${orderId}`)
    // const data = await response.json()

    if (MOCK_ORDERS[orderId]) {
      setTrackedOrder(MOCK_ORDERS[orderId])
      setErrorMessage('')
    } else {
      setTrackedOrder(null)
      setErrorMessage('Order not found. Please check your Order ID.')
    }
  }

  /**
   * Get list of demo order IDs for reference
   * This helps users know what to search for
   */
  const demoOrderIds = Object.keys(MOCK_ORDERS)

  return (
    <div className="public-tracker">
      {/* Header Section */}
      <div className="tracker-header">
        <div className="tracker-header-content">
          <div className="tracker-brand">
            <span className="tracker-icon">📦</span>
            <div>
              <h1 className="tracker-title">Delivery Tracker</h1>
              <p className="tracker-subtitle">
                Track your order in real-time and get live delivery updates
              </p>
            </div>
          </div>
          <Link to="/" className="btn-back-tracker">
            ← Back to Home
          </Link>
        </div>
      </div>

      <div className="tracker-body">
        {/* Search Section */}
        <div className="search-section">
          <div className="search-container">
            <form onSubmit={handleTrack} className="search-form">
              <div className="search-input-group">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Enter Order ID (e.g., ORD-2024-001)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <button type="submit" className="search-button">
                  🔍 Track
                </button>
              </div>
            </form>

            {/* Demo Orders Reference */}
            <div className="demo-orders">
              <span className="demo-label">Try demo orders:</span>
              <div className="demo-buttons">
                {demoOrderIds.map((orderId) => (
                  <button
                    key={orderId}
                    className="demo-button"
                    onClick={() => {
                      setSearchInput(orderId)
                      setTrackedOrder(MOCK_ORDERS[orderId])
                      setErrorMessage('')
                    }}
                  >
                    {orderId}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="error-message">
            <span className="error-icon">❌</span>
            {errorMessage}
          </div>
        )}

        {/* Tracking Card - displayed when order is found */}
        {trackedOrder && <TrackingCard order={trackedOrder} />}

        {/* Empty State - shown when no search performed yet */}
        {!trackedOrder && !errorMessage && (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <h3 className="empty-title">No Order Selected</h3>
            <p className="empty-text">
              Enter your Order ID above to track your delivery in real-time
            </p>
          </div>
        )}

        {/* KPI Cards Section - kept unchanged as per requirements */}
        <div className="kpi-section">
          <h2 className="section-title">📊 Delivery Statistics</h2>
          <div className="kpi-grid">
            {[
              { icon: '📦', label: 'Total Orders', value: '1,240', color: '#2563eb' },
              { icon: '🚚', label: 'In Transit', value: '156', color: '#06b6d4' },
              { icon: '✅', label: 'Delivered', value: '1,084', color: '#16a34a' },
              { icon: '⏱️', label: 'Avg Delivery Time', value: '2.5 hrs', color: '#f59e0b' },
            ].map((kpi, idx) => (
              <div key={idx} className="kpi-card">
                <span className="kpi-icon">{kpi.icon}</span>
                <div className="kpi-content">
                  <div className="kpi-value" style={{ color: kpi.color }}>
                    {kpi.value}
                  </div>
                  <div className="kpi-label">{kpi.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Route Overview Section - placeholder for future expansion */}
        <div className="route-overview-section">
          <h2 className="section-title">🗺️ Route Overview</h2>
          <div className="route-overview-placeholder">
            <span className="placeholder-icon">🗺️</span>
            <p className="placeholder-text">
              Real-time map integration coming soon. Will display live agent GPS 
              tracking and optimized delivery routes.
            </p>
            <p className="placeholder-subtext">
              Future: Integrate with Google Maps API for route visualization
            </p>
          </div>
        </div>

        {/* Information Section */}
        <div className="info-section">
          <div className="info-box">
            <h3 className="info-title">💡 About Order Tracking</h3>
            <ul className="info-list">
              <li>Track your delivery status in real-time</li>
              <li>Get estimated arrival times for better planning</li>
              <li>Contact your delivery agent if needed</li>
              <li>View complete route information and warehouse details</li>
            </ul>
          </div>

          <div className="info-box">
            <h3 className="info-title">🔗 Integration Points</h3>
            <ul className="info-list">
              <li>
                <strong>Agent Dashboard:</strong> Real-time location updates and route
                optimization
              </li>
              <li>
                <strong>Google Maps:</strong> Live GPS tracking with route visualization
              </li>
              <li>
                <strong>Backend API:</strong> Order status updates via WebSocket
              </li>
              <li>
                <strong>Notifications:</strong> SMS/Email delivery status alerts
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
