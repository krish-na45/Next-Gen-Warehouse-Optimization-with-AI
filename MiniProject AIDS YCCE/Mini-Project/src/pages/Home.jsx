import { Link } from 'react-router-dom'
import './Home.css'

const highlights = [
  {
    icon: '📈',
    title: 'Demand Forecasting',
    description: 'ML-powered predictions for accurate inventory planning.',
  },
  {
    icon: '🗺️',
    title: 'Warehouse Path Optimization',
    description: 'Optimal routes for order picking and reduced travel time.',
  },
  {
    icon: '🤖',
    title: 'LLM Decision Support',
    description: 'Explainable AI for human-readable reasoning.',
  },
  {
    icon: '💰',
    title: 'Cost Reduction',
    description: 'Lower operational costs through smarter workflows.',
  },
]

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title animate-fade-in-up">
            Next-Gen Warehouse Optimization with AI
          </h1>
          <p className="hero-subtitle animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            AI-driven Demand Forecasting & Intelligent Order Picking
          </p>
          <div className="hero-buttons animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/system-modules" className="btn btn-primary">
              Explore System
            </Link>
            <Link to="/features" className="btn btn-secondary">
              View Features
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <span className="hero-icon">📦</span>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <h2 className="section-title">About the Project</h2>
          <p className="about-text">
            This project focuses on improving supply chain efficiency by integrating Machine Learning for demand forecasting and AI-based optimization for warehouse order picking. The system also uses Large Language Models (LLMs) for intelligent reasoning and explainable decision support.
          </p>
        </div>
      </section>

      <section className="highlights-section">
        <div className="container">
          <h2 className="section-title">Key Highlights</h2>
          <div className="highlights-grid">
            {highlights.map((item, i) => (
              <div
                key={item.title}
                className="highlight-card"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="highlight-icon">{item.icon}</span>
                <h3 className="highlight-title">{item.title}</h3>
                <p className="highlight-desc">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
