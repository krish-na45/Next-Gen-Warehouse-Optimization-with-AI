import './FeatureLearnMore.css'
import { Link } from 'react-router-dom'

export default function ExplainableAILearnMore() {
  return (
    <div className="feature-learnmore-page">

      {/* HERO SECTION */}
      <section className="learnmore-hero">
        <div className="container">
          <h1>Explainable AI using LLMs</h1>

          <p>
            Learn how Explainable AI (XAI) and Large Language Models (LLMs)
            improve transparency, trust, and decision-making in modern
            supply chain systems.
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
            maxWidth: '960px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
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
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🤔</div>

            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '10px'
              }}
            >
              What is Explainable AI?
            </h2>

            <p
              style={{
                color: '#6b7280',
                lineHeight: '1.75',
                marginBottom: '10px'
              }}
            >
              Explainable AI (XAI) makes AI outputs understandable to humans.
              Instead of a "black box" that just gives a number, XAI tells you
              <strong> why </strong>
              that number was produced — in plain language.
            </p>

            <p
              style={{
                color: '#6b7280',
                lineHeight: '1.75'
              }}
            >
              In this system, the ML model predicts demand and the optimizer
              finds the best picking route. The LLM then reads those outputs
              and generates a natural language explanation a warehouse manager
              can act on.
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
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🏭</div>

            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '10px'
              }}
            >
              Why Needed in Supply Chain?
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
                'Managers need to trust AI decisions before acting on them',
                'Regulators may require audit trails for automated decisions',
                'Operators need to know when to override the system',
                'Training staff is easier when decisions are explained clearly'
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
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🧠</div>

            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '10px'
              }}
            >
              How LLMs Help Here
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
                'Convert raw model outputs → human-readable summaries',
                'Answer follow-up questions about any decision',
                'Compare scenarios ("what if demand increases?")',
                'Generate actionable recommendations from data'
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

          {/* FLOW CARD */}
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
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔗</div>

            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '10px'
              }}
            >
              How the System Connects
            </h2>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                marginTop: '16px'
              }}
            >
              {[
                ['📊', 'ML Model', 'Predicts demand'],
                ['🗺️', 'Optimizer', 'Finds shortest route'],
                ['💬', 'LLM', 'Explains WHY'],
                ['✅', 'Manager', 'Acts confidently']
              ].map(([icon, label, desc], i, arr) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div
                    style={{
                      minWidth: '120px',
                      background: '#f0f4ff',
                      border: '1px solid rgba(37,99,235,0.2)',
                      borderRadius: '12px',
                      padding: '14px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{icon}</span>

                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        color: '#2563eb'
                      }}
                    >
                      {label}
                    </span>

                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}
                    >
                      {desc}
                    </span>
                  </div>

                  {i < arr.length - 1 && (
                    <div
                      style={{
                        fontSize: '1.4rem',
                        color: '#2563eb'
                      }}
                    >
                      →
                    </div>
                  )}
                </div>
              ))}
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
            <Link to="/features">
              <button
                style={{
                  padding: '14px 36px',
                  background:
                    'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(37,99,235,0.3)'
                }}
              >
                🎯 Explore More Features
              </button>
            </Link>
          </div>

        </div>
      </section>
    </div>
  )
}