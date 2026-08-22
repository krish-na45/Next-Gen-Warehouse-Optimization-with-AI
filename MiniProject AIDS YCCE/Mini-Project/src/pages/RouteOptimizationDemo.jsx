import { useNavigate } from 'react-router-dom'
import './RouteOptimizationDemo.css'

export default function RouteOptimizationDemo() {
  const navigate = useNavigate()

  return (
    <div className="rod-page">
      <section className="rod-hero">
        <div className="container">
          <div className="rod-badge">🗺️ Live Demo</div>
          <h1 className="rod-title">Route Optimization Demo</h1>
          <p className="rod-subtitle">
            Experience real-time delivery tracking and intelligent route planning.
            Choose your role to get started.
          </p>
        </div>
      </section>

      <section className="rod-panels">
        <div className="container">
          <div className="rod-cards">
            {/* Delivery Agent Panel */}
            <div className="rod-card rod-card--agent">
              <div className="rod-card-icon">🚚</div>
              <h2>Delivery Agent</h2>
              <p>
                Log in as a delivery agent to view your assigned orders, get optimized
                routes, and update delivery status in real time.
              </p>
              <ul className="rod-features-list">
                <li>📍 Optimized route from warehouse to customer</li>
                <li>🗺️ Turn-by-turn Google Maps navigation</li>
                <li>📦 Order & customer details</li>
                <li>🔄 Live status updates</li>
              </ul>
              <button className="btn btn-primary rod-btn" onClick={() => navigate('/route-optimization/agent/login')}>
                Agent Login
              </button>
            </div>

            {/* Company / Admin Panel */}
            <div className="rod-card rod-card--admin">
              <div className="rod-card-icon">🏢</div>
              <h2>Company Dashboard</h2>
              <p>
                Monitor all delivery agents on a live map. Track progress, filter by
                status, and view summary statistics across all deliveries.
              </p>
              <ul className="rod-features-list">
                <li>🗺️ Live map with all agent markers</li>
                <li>🟢 Real-time status tracking</li>
                <li>📊 Delivery summary stats</li>
                <li>🔍 Filter & click-to-inspect agents</li>
              </ul>
              <button className="btn btn-secondary rod-btn" onClick={() => navigate('/route-optimization/admin')}>
                Open Dashboard
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
