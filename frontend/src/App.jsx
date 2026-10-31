import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Prediction from './pages/Prediction';
import Analytics from './pages/Analytics';
import ModelPerformance from './pages/ModelPerformance';
import { fetchHealth } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [backendHealthy, setBackendHealthy] = useState(false);

  useEffect(() => {
    async function checkBackend() {
      const res = await fetchHealth();
      setBackendHealthy(res.status === 'healthy');
    }

    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        backendHealthy={backendHealthy} 
      />

      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'prediction' && <Prediction />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'models' && <ModelPerformance />}
      </main>

      <Footer />
    </div>
  );
}
