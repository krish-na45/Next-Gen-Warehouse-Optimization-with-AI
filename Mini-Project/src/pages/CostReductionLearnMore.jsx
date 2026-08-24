import './FeatureLearnMore.css'
import { Link } from 'react-router-dom'

export default function CostReductionLearnMore() {
  return (
    <div className="feature-learnmore-page">

      {/* HERO SECTION */}
      <section className="learnmore-hero">
        <div className="container">
          <h1>Operational Cost Reduction</h1>

          <p>
            Learn how AI-driven warehouse optimization reduces operational
            expenses by minimizing travel distance, improving picking
            efficiency, and optimizing labor utilization.
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
              💡
            </div>

            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '10px'
              }}
            >
              What is Operational Cost Reduction?
            </h2>

            <p
              style={{
                color: '#6b7280',
                lineHeight: '1.75',
                marginBottom: '8px'
              }}
            >
              Operational cost reduction is the measurable decrease in expenses
              achieved by optimizing warehouse processes. In this system, it is
              <strong> derived directly from route optimization output </strong>
              — not calculated independently.
            </p>

            <p
              style={{
                color: '#6b7280',
                lineHeight: '1.75'
              }}
            >
              Every meter saved in travel distance, every minute saved in
              picking time, and every optimized route directly translates into
              lower labor costs, reduced fuel consumption, and higher
              throughput.
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
              🔗
            </div>

            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '10px'
              }}
            >
              Connected to Other Modules
            </h2>

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
                'Warehouse Optimization → provides route distance',
                'Demand Forecasting → reduces overstock costs',
                'LLM Explainer → explains why costs dropped',
                'All three feed into this cost dashboard'
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
              🧮
            </div>

            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '10px'
              }}
            >
              Cost Formula
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
                  color: '#6ee7b7',
                  lineHeight: '1.8',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {`Total Cost =
  (Distance × ₹0.42/m)
  + (Time × ₹25/min)
  + Fuel/Ops base

Savings = Before − After`}
              </code>
            </div>
          </div>

          {/* PRINCIPLE CARD */}
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
                marginBottom: '10px'
              }}
            >
              One-Line Description
            </h2>

            <div
              style={{
                background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                borderLeft: '4px solid #16a34a',
                borderRadius: '12px',
                padding: '16px 20px'
              }}
            >
              <p
                style={{
                  fontSize: '0.95rem',
                  color: '#111827',
                  lineHeight: '1.7',
                  fontStyle: 'italic',
                  margin: 0
                }}
              >
                "The Operational Cost Reduction module analyzes pre- and
                post-optimization metrics to quantify savings in time,
                distance, and labor, demonstrating the real-world impact
                of AI-driven warehouse optimization."
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