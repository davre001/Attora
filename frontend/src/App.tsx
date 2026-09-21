import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/layout/Nav'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import Desk from './pages/Desk'
import Positions from './pages/Positions'
import Audit from './pages/Audit'
import Setup from './pages/Setup'
import Docs from './pages/Docs'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-noise-overlay" aria-hidden="true" />
      <Nav />
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/app"       element={<Desk />} />
        <Route path="/positions" element={<Positions />} />
        <Route path="/audit"     element={<Audit />} />
        <Route path="/setup"     element={<Setup />} />
        <Route path="/docs"      element={<Docs />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
