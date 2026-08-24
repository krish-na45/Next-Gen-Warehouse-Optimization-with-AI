import './ModuleWorkflow.css'
import { Link } from 'react-router-dom'

export default function ModuleWorkflow() {
  return (
    <div className="workflow-page">
      <section className="workflow-hero">
        <div className="container">
          <h1>System Module Workflow</h1>
          <p>
            A complete end-to-end view of all system module terms and how they work together to optimize warehouse operations.
          </p>
          <Link to="/system-modules" className="btn btn-secondary">
            Back to System Modules
          </Link>
        </div>
      </section>

      <section className="workflow-overview">
        <div className="container">
          <h2>Workflow overview</h2>
          <p>
            The system processes warehouse data through a sequence of specialized modules that collect, clean, predict, optimize, and explain decisions. Each module builds on the previous stage so the platform can deliver smarter inventory, routing, and planning recommendations.
          </p>

          <div className="workflow-steps">
            <article>
              <h3>1. Data Collection</h3>
              <p>
                Inventory, order, and sensor data are gathered from warehouse management systems, IoT devices, and external sources. This module ensures the platform has accurate operational inputs.
              </p>
            </article>
            <article>
              <h3>2. Data Preprocessing</h3>
              <p>
                Raw data is cleaned, normalized, and transformed into consistent datasets for machine learning models. This includes handling missing values, standardizing units, and aligning time series.
              </p>
            </article>
            <article>
              <h3>3. ML Forecasting</h3>
              <p>
                Forecast models analyze historical demand and inventory trends to predict future stock requirements. The output includes demand forecasts, replenishment needs, and expected order volumes.
              </p>
            </article>
            <article>
              <h3>4. Path Optimization</h3>
              <p>
                Optimal picking and routing plans are computed using AI algorithms. This module reduces travel time, balances workloads, and improves warehouse throughput.
              </p>
            </article>
            <article>
              <h3>5. LLM Reasoning</h3>
              <p>
                Explainable insights and decision recommendations are generated, helping users understand why forecasts and route choices were made. This module supports smarter planning and operations.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="workflow-terms">
        <div className="container">
          <h2>Key terms and definitions</h2>
          <div className="term-grid">
            <div className="term-card">
              <h3>Inventory Data</h3>
              <p>Details about stock levels, product locations, and available quantities across warehouses.</p>
            </div>
            <div className="term-card">
              <h3>Order Data</h3>
              <p>Information on incoming and outgoing orders, including volumes, priorities, and fulfillment deadlines.</p>
            </div>
            <div className="term-card">
              <h3>Sensor Data</h3>
              <p>Real-time telemetry from warehouse sensors, such as temperature, movement, and equipment status.</p>
            </div>
            <div className="term-card">
              <h3>Forecast</h3>
              <p>A machine learning prediction of future demand, inventory needs, or replenishment timing.</p>
            </div>
            <div className="term-card">
              <h3>Optimization</h3>
              <p>The process of selecting efficient routes, schedules, and layouts to minimize cost and maximize throughput.</p>
            </div>
            <div className="term-card">
              <h3>Explainability</h3>
              <p>Clear reasoning and human-readable context for model outputs and recommended actions.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
