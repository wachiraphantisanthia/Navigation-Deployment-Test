import { Link, Navigate, NavLink, Route, Routes } from "react-router-dom";

import { apiBaseUrl } from "./api/client";
import { AdminPage } from "./pages/AdminPage";
import { KioskPage } from "./pages/KioskPage";

function LandingPage() {
  return (
    <div className="landing-page">
      <section className="hero-card">
        <div className="hero-badge">Indoor Navigation System</div>
        <h1>Map Editor + Overview</h1>
        <p>
          React + TypeScript frontend for the existing FastAPI indoor navigation backend.
          Manage graph nodes, edges, kiosks, categories, floor maps, and route simulations.
        </p>
        <div className="hero-actions">
          <Link className="primary-button" to="/admin" id="btn-home">
            Open Map Editor
          </Link>
          <Link className="secondary-button" to="/kiosk" id="btn-category">
            Open Overview
          </Link>
          <a className="ghost-button" href={`${apiBaseUrl}/docs`} target="_blank" rel="noreferrer">
            Open API Docs
          </a>
        </div>
        <div className="hero-links">
          <span>Backend: {apiBaseUrl}</span>
          <span>Swagger: {apiBaseUrl}/docs</span>
        </div>
      </section>
    </div>
  );
}

function TopShell() {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="brand-mark">IN</div>
        <div>
          <strong>Indoor Navigation</strong>
          <div className="brand-subtitle">React + FastAPI</div>
        </div>
      </div>
      <nav className="topbar-nav">
        <NavLink to="/admin" className={({ isActive }: { isActive: boolean }) => (isActive ? "active" : "")}>Map Editor</NavLink>
        <NavLink to="/kiosk" className={({ isActive }: { isActive: boolean }) => (isActive ? "active" : "")}>Overview</NavLink>
        <a href={`${apiBaseUrl}/docs`} target="_blank" rel="noreferrer">
          API Docs
        </a>
      </nav>
    </header>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <TopShell />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/kiosk" element={<KioskPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
