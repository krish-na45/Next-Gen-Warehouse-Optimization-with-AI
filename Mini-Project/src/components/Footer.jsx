import './Footer.css'

const currentYear = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo">📦</span>
            <span>Next-Gen Warehouse Optimization with AI</span>
          </div>
          <p className="footer-credits">
            Project credits · College / Department placeholder
          </p>
          <p className="footer-year">© {currentYear}</p>
        </div>
      </div>
    </footer>
  )
}
