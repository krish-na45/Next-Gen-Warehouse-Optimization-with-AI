import './FeatureLearnMore.css'
import { Link } from 'react-router-dom'

export default function WarehouseOrderPickingLearnMore() {
  return (
    <div className="feature-learnmore-page">

      {/* HERO SECTION */}
      <section className="learnmore-hero">
        <div className="container">
          <h1>Warehouse Order Picking Optimization</h1>

          <p>
            Learn how AI-driven route optimization improves warehouse order
            picking efficiency by reducing travel distance, minimizing labor
            costs, and accelerating order fulfillment operations.
          </p>

          <Link to="/features" className="btn btn-secondary">
            ← Back to Features
          </Link>
        </div>
      </section>

      {/* ══════════ LEARN MORE CONTENT ══════════ */}
      <section
        style={{
          padding: '40px 0 32px'
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2,1fr)',
            gap: '20px'
          }}
        >

          {/* CARD 1 */}
          <div
            style={{
              gridColumn: '1 / -1',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
            }}
          >
            <div
              style={{
                fontSize: '2rem',
                marginBottom: '12px'
              }}
            >
              📦
            </div>

            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '10px'
              }}
            >
              What is Warehouse Order Picking?
            </h2>

            <p
              style={{
                color: '#6b7280',
                lineHeight: '1.75',
                marginBottom: '8px'
              }}
            >
              Warehouse order picking is one of the most important and
              labor-intensive operations in warehouse management,
              contributing to nearly
              <strong> 50–60% of total operational costs. </strong>
              Workers often spend significant time walking between aisles,
              increasing travel time, delaying shipments, and reducing
              overall warehouse efficiency.
            </p>

            <p
              style={{
                color: '#6b7280',
                lineHeight: '1.75'
              }}
            >
              Traditional warehouse systems usually follow static picking
              methods that cannot adapt to dynamic warehouse conditions,
              leading to inefficient routes and unnecessary movement.
            </p>
          </div>

          {/* CARD 2 */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
            }}
          >
            <div
              style={{
                fontSize: '2rem',
                marginBottom: '12px'
              }}
            >
              🤖
            </div>

            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '10px'
              }}
            >
              AI-Driven Route Optimization
            </h2>

            <p
              style={{
                color: '#6b7280',
                lineHeight: '1.75',
                marginBottom: '12px'
              }}
            >
              Our system uses
              <strong> AI-driven route optimization </strong>
              to improve warehouse picking efficiency.
            </p>

            <ul
              style={{
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: 0,
                margin: 0
              }}
            >
              {[
                'Dijkstra’s Algorithm calculates shortest routes',
                'Minimizes unnecessary worker movement',
                'Improves aisle navigation efficiency',
                'Optimizes product collection sequence',
                'Supports faster warehouse operations'
              ].map((item, i) => (
                <li
                  key={i}
                  style={{
                    color: '#6b7280',
                    lineHeight: '1.6'
                  }}
                >
                  → {item}
                </li>
              ))}
            </ul>
          </div>

          {/* CARD 3 */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
            }}
          >
            <div
              style={{
                fontSize: '2rem',
                marginBottom: '12px'
              }}
            >
              🛣️
            </div>

            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '10px'
              }}
            >
              Route Optimization Logic
            </h2>

            <div
              style={{
                background: '#1e293b',
                borderRadius: '12px',
                padding: '16px 20px',
                marginTop: '12px'
              }}
            >
              <code
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: '0.82rem',
                  color: '#fcd34d',
                  lineHeight: '1.8',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {`Algorithm:
Dijkstra’s Shortest Path

Inputs:
• Aisle List
• Product Locations
• Starting Point

Outputs:
• Optimized Picking Route
• Faster Product Collection`}
              </code>
            </div>

            <p
              style={{
                color: '#6b7280',
                lineHeight: '1.75',
                marginTop: '14px'
              }}
            >
              The algorithm calculates the most efficient route between
              warehouse aisles, helping workers collect products faster
              while minimizing travel distance.
            </p>
          </div>

          {/* BENEFITS CARD */}
          <div
            style={{
              gridColumn: '1 / -1',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
            }}
          >
            <div
              style={{
                fontSize: '2rem',
                marginBottom: '12px'
              }}
            >
              🎯
            </div>

            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '14px'
              }}
            >
              Key Benefits
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2,1fr)',
                gap: '12px',
                marginTop: '12px'
              }}
            >
              {[
                'Reduces worker travel time',
                'Minimizes operational and labor costs',
                'Improves order fulfillment speed',
                'Enhances warehouse efficiency',
                'Supports smarter route planning'
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: '#fefce8',
                    border: '1px solid #fde68a',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    color: '#92400e',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}
                >
                  ✅ {item}
                </div>
              ))}
            </div>
          </div>

          {/* TECHNOLOGY CARD */}
          <div
            style={{
              gridColumn: '1 / -1',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
            }}
          >
            <div
              style={{
                fontSize: '2rem',
                marginBottom: '12px'
              }}
            >
              💻
            </div>

            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '10px'
              }}
            >
              Full-Stack Integration
            </h2>

            <div
              style={{
                background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
                borderLeft: '4px solid #2563eb',
                borderRadius: '12px',
                padding: '16px 20px'
              }}
            >
              <p
                style={{
                  fontSize: '0.95rem',
                  color: '#111827',
                  lineHeight: '1.7',
                  margin: 0
                }}
              >
                The route optimization system is integrated with a
                full-stack application using
                <strong>
                  {' '}React.js, Node.js, Express.js, and Python{' '}
                </strong>
                to provide real-time warehouse management and intelligent
                decision-making capabilities.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '8px 0 16px'
            }}
          >
          </div>

        </div>
      </section>
    </div>
  )
}