import './FeatureLearnMore.css'
import { Link } from 'react-router-dom'

export default function DemandForecastingLearnMore() {
  return (
    <div className="feature-learnmore-page">

      {/* HERO SECTION */}
      <section className="learnmore-hero">
        <div className="container">
          <h1>AI-Based Demand Forecasting</h1>

          <p>
            Learn how Artificial Intelligence and Machine Learning help
            warehouses predict future product demand for smarter inventory
            planning and optimized supply chain operations.
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
              📈
            </div>

            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '10px'
              }}
            >
              What is Demand Forecasting?
            </h2>

            <p
              style={{
                color: '#6b7280',
                lineHeight: '1.75',
                marginBottom: '8px'
              }}
            >
              Demand forecasting helps warehouses predict future product demand
              using Artificial Intelligence and Machine Learning. Accurate
              forecasting improves inventory planning, prevents stock shortages,
              reduces overstocking, and enhances supply chain efficiency.
            </p>

            <p
              style={{
                color: '#6b7280',
                lineHeight: '1.75'
              }}
            >
              The system analyzes historical warehouse and inventory data to
              identify trends and generate reliable demand predictions for
              smarter warehouse management decisions.
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
              Machine Learning Model
            </h2>

            <p
              style={{
                color: '#6b7280',
                lineHeight: '1.75',
                marginBottom: '12px'
              }}
            >
              Our system uses a
              <strong> Random Forest Machine Learning model </strong>
              trained on historical warehouse and inventory data.
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
                'Product category analysis',
                'Inventory level tracking',
                'Lead time evaluation',
                'Unit price trends',
                'Time-based demand patterns'
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
              ⚙️
            </div>

            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '10px'
              }}
            >
              Data Preprocessing Pipeline
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
                  color: '#93c5fd',
                  lineHeight: '1.8',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {`Pipeline:
OneHotEncoder → categorical features
StandardScaler → numerical scaling

Processed Features:
• Product Category
• Inventory Level
• Lead Time
• Unit Price
• Historical Trends`}
              </code>
            </div>

            <p
              style={{
                color: '#6b7280',
                lineHeight: '1.75',
                marginTop: '14px'
              }}
            >
              This preprocessing pipeline improves prediction accuracy and
              ensures efficient handling of warehouse data.
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
                'Prevents stock-outs and overstocking',
                'Reduces inventory and operational costs',
                'Improves warehouse planning',
                'Supports real-time decision-making',
                'Enhances supply chain efficiency'
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    color: '#1e40af',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}
                >
                  ✅ {item}
                </div>
              ))}
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
              One-Line Description
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
                  fontStyle: 'italic',
                  margin: 0
                }}
              >
                "The AI-Based Demand Forecasting module uses Machine Learning
                to analyze historical warehouse data and predict future product
                demand, enabling smarter inventory planning and efficient
                supply chain management."
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