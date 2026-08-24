import './FeatureLearnMore.css'
import { Link } from 'react-router-dom'

export default function FeatureLearnMore() {
  return (
    <div className="feature-learnmore-page">
      <div className="container">
        <h1>Feature Learn More</h1>
        <p>Content has been removed.</p>
        <Link to="/features" className="btn btn-secondary">
          Back to Features
        </Link>
      </div>
    </div>
  )
}
