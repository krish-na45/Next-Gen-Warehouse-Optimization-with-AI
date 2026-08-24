import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Features from './pages/Features.jsx'
import SystemModules from './pages/SystemModules.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Contact from './pages/Contact.jsx'
import Login from './pages/Login.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import DataExplorer from './pages/DataExplorer.jsx'
import ModelTester from './pages/ModelTester.jsx'
import ModuleWorkflow from './pages/ModuleWorkflow.jsx'
import ModuleDetails from './pages/ModuleDetails.jsx'
import DemandForecastingLearnMore from './pages/DemandForecastingLearnMore.jsx'
import WarehouseOrderPickingLearnMore from './pages/WarehouseOrderPickingLearnMore.jsx'
import ExplainableAILearnMore from './pages/ExplainableAILearnMore.jsx'
import CostReductionLearnMore from './pages/CostReductionLearnMore.jsx'
import ExplainableAI from './pages/ExplainableAI.jsx'
import CostReduction from './pages/CostReduction.jsx'
import RouteOptimizationDemo from './pages/RouteOptimizationDemo.jsx'
import AgentLogin from './pages/AgentLogin.jsx'
import AgentDashboard from './pages/AgentDashboard.jsx'
import AdminTracking from './pages/AdminTracking.jsx'
import PublicDeliveryTracker from './pages/PublicDeliveryTracker.jsx'
import './App.css'

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/features" element={<Features />} />
          <Route path="/system-modules" element={<SystemModules />} />
          <Route path="/system-modules/workflow" element={<ModuleWorkflow />} />
          <Route path="/system-modules/details" element={<ModuleDetails />} />
          <Route path="/features/demand-forecasting" element={<DemandForecastingLearnMore />} />
          <Route path="/features/order-picking" element={<WarehouseOrderPickingLearnMore />} />
          <Route path="/features/explainable-ai" element={<ExplainableAILearnMore />} />
          <Route path="/features/cost-reduction" element={<CostReductionLearnMore />} />
          <Route path="/explainable-ai" element={<ExplainableAI />} />
          <Route path="/cost-reduction" element={<CostReduction />} />
          <Route path="/route-optimization" element={<RouteOptimizationDemo />} />
          <Route path="/route-optimization/agent/login" element={<AgentLogin />} />
          <Route path="/route-optimization/agent/dashboard" element={<AgentDashboard />} />
          <Route path="/route-optimization/admin" element={<AdminTracking />} />
          <Route path="/track-delivery" element={<PublicDeliveryTracker />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/data" element={<DataExplorer />} />
          <Route path="/model-tester" element={<ModelTester />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App;