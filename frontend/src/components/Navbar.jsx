import React from 'react';
import { LayoutDashboard, UserCheck, BarChart2, Cpu, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, backendHealthy }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'prediction', label: 'Prediction Form', icon: UserCheck },
    { id: 'analytics', label: 'EDA & Insights', icon: BarChart2 },
    { id: 'models', label: 'Model Performance', icon: Cpu },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="brand" onClick={() => setActiveTab('dashboard')}>
          <div className="brand-icon-wrapper">
            <Sparkles size={22} />
          </div>
          <div>
            <span className="brand-text">StudentCare AI</span>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 500, letterSpacing: '0.05em' }}>
              DEPRESSION PREDICTION SYSTEM
            </div>
          </div>
        </div>

        <ul className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </li>
            );
          })}
        </ul>

        <div className={`backend-status-pill ${backendHealthy ? '' : 'offline'}`}>
          <div className="status-dot"></div>
          <span>{backendHealthy ? 'Flask API Online' : 'API Connecting...'}</span>
        </div>
      </div>
    </nav>
  );
}
