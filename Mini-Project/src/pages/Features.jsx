import { Link } from 'react-router-dom'
import './Features.css'

const features = [
  {
    icon: '📊',
    title: 'AI-Based Demand Forecasting',
    description: 'Predicts customer demand using ML models.',
    learnMoreLink: '/features/demand-forecasting',
    demoLink: '/dashboard',
  },
  {
    icon: '🛒',
    title: 'Warehouse Order Picking Optimization',
    description: 'Finds optimal picking routes to minimize travel time.',
    learnMoreLink: '/features/order-picking',
    demoLink: '/route-optimization',
  },
  {
    icon: '💬',
    title: 'Explainable AI using LLMs',
    description: 'Provides human-readable explanations.',
    learnMoreLink: '/features/explainable-ai',
    demoLink: '/explainable-ai',
  },
  {
    icon: '📉',
    title: 'Operational Cost Reduction',
    description: 'Improves efficiency and reduces waste.',
    learnMoreLink: '/features/cost-reduction',
    demoLink: '/cost-reduction',
  },
]

export default function Features() {
  return (
    <div className="features-page">
      <section className="features-hero">
        <div className="container">
          <h1 className="page-title">Features</h1>
          <p className="page-subtitle">
            Discover how AI transforms warehouse operations
          </p>
        </div>
      </section>

      <section className="features-grid-section">
        <div className="container">
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={f.title} className={`feature-card${f.highlight ? ' feature-card--highlight' : ''}`} style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="feature-icon">{f.icon}</span>
                <h2 className="feature-title">{f.title}</h2>
                <p className="feature-desc">{f.description}</p>
                <div className="feature-actions">
                  <Link to={f.learnMoreLink} className="btn btn-primary">Learn More</Link>
                  <Link to={f.demoLink || '/dashboard'} className="btn btn-secondary">
                    {f.highlight ? '🚀 Open Demo' : 'View Demo'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
