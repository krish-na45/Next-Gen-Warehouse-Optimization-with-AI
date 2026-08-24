import './ModuleDetails.css'
import { Link } from 'react-router-dom'

export default function ModuleDetails() {
  return (
    <div className="details-page">
      <section className="details-hero">
        <div className="container">
          <h1>Module Details</h1>
          <p>
            Explore the capabilities and role of each system module in the warehouse AI pipeline.
          </p>
          <Link to="/system-modules" className="btn btn-secondary">
            Back to System Modules
          </Link>
        </div>
      </section>

      <section className="details-content">
        <div className="container">
          <div className="details-grid">
            <article>
              <h2>Data Collection Module</h2>
              <p>
                Collects inventory, order, and sensor data from warehouse systems. It integrates with tracking systems and captures the data needed for reliable forecasting and optimization.
              </p>
            </article>
            <article>
              <h2>Data Preprocessing Module</h2>
              <p>
                Cleans and standardizes raw inputs, removing inconsistencies, filling gaps, and normalizing values so machine learning models receive accurate and usable datasets.
              </p>
            </article>
            <article>
              <h2>ML Forecasting Module</h2>
              <p>
                Uses historical behavior to predict demand and replenishment needs. Forecast outputs help teams plan inventory, reduce stockouts, and align replenishment cycles.
              </p>
            </article>
            <article>
              <h2>Path Optimization Engine</h2>
              <p>
                Creates efficient picking and routing strategies using intelligent optimization. It minimizes travel distance and time across the warehouse floor.
              </p>
            </article>
            <article>
              <h2>LLM Reasoning Module</h2>
              <p>
                Provides explainable insights behind recommendations, translating model outputs into clear operational guidance for warehouse managers.
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  )
}
