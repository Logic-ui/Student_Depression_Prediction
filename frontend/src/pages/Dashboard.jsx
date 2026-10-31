import React, { useEffect, useState } from 'react';
import { 
  Users, Activity, Brain, Award, ArrowRight, ShieldCheck, 
  HeartHandshake, TrendingUp, AlertTriangle 
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { fetchEdaSummary, fetchEdaCharts, fetchModelMetrics } from '../services/api';

const PIE_COLORS = ['#3b82f6', '#f43f5e'];

export default function Dashboard({ setActiveTab }) {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [sumData, chartData, metricData] = await Promise.all([
          fetchEdaSummary(),
          fetchEdaCharts(),
          fetchModelMetrics()
        ]);
        setSummary(sumData);
        setCharts(chartData);
        setMetrics(metricData);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data from backend');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Fetching actual dataset statistics & model metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner">
        <AlertTriangle size={20} />
        <div>
          <strong>Backend Connection Error:</strong> {error}
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Ensure the Flask backend is running on <code>http://127.0.0.1:5000</code>.
          </p>
        </div>
      </div>
    );
  }

  const bestModelSummary = metrics?.summary || {};

  return (
    <div>
      {/* Hero Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 className="page-title">Student Depression Prediction & Analytics</h1>
          <p className="page-subtitle">
            An end-to-end analytical framework and machine learning prediction system analyzing how health, academic, social, and economic factors influence student mental well-being.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => setActiveTab('prediction')}>
            <span>Assess a Student</span>
            <ArrowRight size={18} />
          </button>
          <button className="btn btn-secondary" onClick={() => setActiveTab('analytics')}>
            <span>Explore Full EDA</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="kpi-grid">
        <div className="glass-panel kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Survey Records</span>
            <div className="kpi-icon"><Users size={20} color="var(--accent-primary)" /></div>
          </div>
          <div className="kpi-value">{summary?.total_records?.toLocaleString() || '4,464'}</div>
          <div className="kpi-caption">Real university student participants</div>
        </div>

        <div className="glass-panel kpi-card rose">
          <div className="kpi-header">
            <span className="kpi-title">Depression Prevalence</span>
            <div className="kpi-icon"><Activity size={20} color="var(--accent-rose)" /></div>
          </div>
          <div className="kpi-value">{summary?.overall_depression_rate || '26.9'}%</div>
          <div className="kpi-caption">{summary?.depressed_count} reported depression (1:2.7 ratio)</div>
        </div>

        <div className="glass-panel kpi-card cyan">
          <div className="kpi-header">
            <span className="kpi-title">Selected Model</span>
            <div className="kpi-icon"><Brain size={20} color="var(--accent-cyan)" /></div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.7rem', paddingTop: '0.35rem' }}>
            {metrics?.best_model || 'Gradient Boosting'}
          </div>
          <div className="kpi-caption">Highest 5-Fold Stratified F1 & ROC-AUC</div>
        </div>

        <div className="glass-panel kpi-card emerald">
          <div className="kpi-header">
            <span className="kpi-title">Model F1-Score</span>
            <div className="kpi-icon"><Award size={20} color="var(--accent-emerald)" /></div>
          </div>
          <div className="kpi-value">{((bestModelSummary.test_f1 || 0.9873) * 100).toFixed(1)}%</div>
          <div className="kpi-caption">
            Test Recall: {((bestModelSummary.test_recall || 0.975) * 100).toFixed(1)}% | Precision: {((bestModelSummary.test_precision || 1.0) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Interactive Charts Grid */}
      <div className="charts-grid-2">
        {/* Class Distribution Donut */}
        <div className="glass-panel chart-panel">
          <div className="chart-header">
            <div>
              <h2 className="chart-title">Depression Distribution (Target Variable)</h2>
              <p className="chart-subtitle">Survey baseline breakdown across 4,464 students</p>
            </div>
            <ShieldCheck size={20} color="var(--accent-cyan)" />
          </div>
          <div style={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.target_distribution || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                >
                  {(charts?.target_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(val, name, item) => [`${val} students (${item.payload.percentage}%)`, name]}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health Condition vs Depression */}
        <div className="glass-panel chart-panel">
          <div className="chart-header">
            <div>
              <h2 className="chart-title">Health Condition vs Depression Rate</h2>
              <p className="chart-subtitle">Strongest predictive association identified during EDA</p>
            </div>
            <TrendingUp size={20} color="var(--accent-rose)" />
          </div>
          <div style={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.health_chart || []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="condition" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" unit="%" />
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(val, name) => [`${val}%`, 'Depression Rate']}
                />
                <Bar dataKey="depression_rate" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Depression Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Key Analytical Insights Cards */}
      <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', marginTop: '1rem' }}>
        Key Empirical Insights
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {(summary?.key_insights || []).map((insight, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.6rem' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '6px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem'
              }}>
                {idx + 1}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{insight.title}</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              {insight.description}
            </p>
          </div>
        ))}
      </div>

      {/* Disclaimer Banner */}
      <div className="disclaimer-banner">
        <HeartHandshake size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Educational & Research Disclaimer:</strong> This system uses statistical machine learning to identify patterns in survey responses. It does not provide medical or psychological clinical diagnoses. If you or someone you know is experiencing persistent emotional distress, please connect with a qualified mental health healthcare provider or university counseling center.
        </div>
      </div>
    </div>
  );
}
