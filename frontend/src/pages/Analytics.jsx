import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Activity, Users, GraduationCap, MapPin, Layers, 
  HelpCircle, AlertTriangle, ShieldCheck 
} from 'lucide-react';
import { fetchEdaCharts, fetchEdaSummary } from '../services/api';

const PIE_COLORS = ['#3b82f6', '#f43f5e'];

export default function Analytics() {
  const [charts, setCharts] = useState(null);
  const [summary, setSummary] = useState(null);
  const [activeCategory, setActiveCategory] = useState('health');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [chartData, summaryData] = await Promise.all([
          fetchEdaCharts(),
          fetchEdaSummary()
        ]);
        setCharts(chartData);
        setSummary(summaryData);
      } catch (err) {
        setError(err.message || 'Failed to load EDA analytics data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading exploratory data analysis from backend...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner">
        <AlertTriangle size={20} />
        <div>
          <strong>Error Loading Analytics:</strong> {error}
        </div>
      </div>
    );
  }

  const categories = [
    { id: 'health', label: 'Health & Well-being', icon: Activity },
    { id: 'social', label: 'Social & Relationships', icon: Users },
    { id: 'academic', label: 'Academic & Financial', icon: GraduationCap },
    { id: 'geographic', label: 'Geographic Divisions', icon: MapPin },
    { id: 'correlation', label: 'Numerical Correlation', icon: Layers },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Exploratory Data Analysis (EDA)</h1>
        <p className="page-subtitle">
          Comprehensive empirical exploration of factors associated with student depression across 4,464 surveyed individuals.
        </p>
      </div>

      {/* Category Navigation Bar */}
      <div className="tab-nav">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              className={`tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Icon size={16} />
                <span>{cat.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* 1. Health & Well-being */}
      {activeCategory === 'health' && (
        <div>
          <div className="charts-grid-2">
            <div className="glass-panel chart-panel">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Health Condition vs Depression Status</h3>
                  <p className="chart-subtitle">Absolute counts of depressed vs not depressed students</p>
                </div>
              </div>
              <div style={{ height: 320, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.health_chart || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="condition" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="not_depressed" name="Not Depressed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="depressed" name="Depressed" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel chart-panel">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Health Condition Depression Rate (%)</h3>
                  <p className="chart-subtitle">Proportion of depressed individuals per health tier</p>
                </div>
              </div>
              <div style={{ height: 320, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.health_chart || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="condition" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" unit="%" />
                    <Tooltip 
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                      formatter={(val) => [`${val}%`, 'Depression Rate']}
                    />
                    <Bar dataKey="depression_rate" name="Depression Rate (%)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', marginTop: '1rem' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--accent-cyan)', marginBottom: '0.4rem' }}>
              Analytical Finding: Somatic and Physical Health Signal
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              A profound relationship is observed between reported health condition and depression. 100% of students reporting "Critical" condition and 54.9% of those reporting "Abnormal" conditions experience depression, whereas students in "Good" health exhibited a 0.0% depression rate. This highlights that physical health disorders, chronic pain, or physiological vulnerability are heavily linked with depressive episodes.
            </p>
          </div>
        </div>
      )}

      {/* 2. Social & Relationships */}
      {activeCategory === 'social' && (
        <div>
          <div className="charts-grid-2">
            <div className="glass-panel chart-panel">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Relationship Status vs Depression</h3>
                  <p className="chart-subtitle">Single vs In a Relationship vs Complicated</p>
                </div>
              </div>
              <div style={{ height: 320, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.relationship_chart || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="status" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="not_depressed" name="Not Depressed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="depressed" name="Depressed" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel chart-panel">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Friend Circle Social Buffer</h3>
                  <p className="chart-subtitle">Active peer circle vs isolated students</p>
                </div>
              </div>
              <div style={{ height: 320, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.friend_chart || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="has_friends" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" unit="%" />
                    <Tooltip 
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                      formatter={(val) => [`${val}%`, 'Depression Rate']}
                    />
                    <Bar dataKey="depression_rate" name="Depression Rate (%)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', marginTop: '1rem' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--accent-emerald)', marginBottom: '0.4rem' }}>
              Analytical Finding: The Protective Power of Social Ties
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Students who have active friend circles experience significantly lower rates of depression (24.0% vs 34.3% for those without a friend circle). Similarly, students in supportive relationships show an 11.5% depression rate compared to 35.9% for single students. Peer support systems act as an empirical buffer against academic and lifestyle stressors.
            </p>
          </div>
        </div>
      )}

      {/* 3. Academic & Financial */}
      {activeCategory === 'academic' && (
        <div>
          <div className="charts-grid-2">
            <div className="glass-panel chart-panel">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">CGPA Tiers vs Depression Rate</h3>
                  <p className="chart-subtitle">Depression prevalence across academic performance bands</p>
                </div>
              </div>
              <div style={{ height: 320, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.cgpa_chart || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="band" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" unit="%" />
                    <Tooltip 
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                      formatter={(val) => [`${val}%`, 'Depression Rate']}
                    />
                    <Bar dataKey="depression_rate" name="Depression Rate (%)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel chart-panel">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Family Background Socioeconomic Stratification</h3>
                  <p className="chart-subtitle">Depression rates by family income bracket</p>
                </div>
              </div>
              <div style={{ height: 320, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.family_chart || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="background" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" unit="%" />
                    <Tooltip 
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                      formatter={(val) => [`${val}%`, 'Depression Rate']}
                    />
                    <Bar dataKey="depression_rate" name="Depression Rate (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', marginTop: '1rem' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--accent-amber)', marginBottom: '0.4rem' }}>
              Analytical Finding: Academic Struggles & Financial Vulnerability
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              CGPA is negatively correlated with depression (-0.096). Lower CGPA tiers (2.00-2.49) show higher vulnerability, while top academic tiers display lower rates. Furthermore, students from lower-middle-class backgrounds face higher rates (30.6%) compared to affluent students (17.6%), highlighting the role of financial anxiety in student mental health.
            </p>
          </div>
        </div>
      )}

      {/* 4. Geographic Divisions */}
      {activeCategory === 'geographic' && (
        <div>
          <div className="glass-panel chart-panel">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Depression Rate by Home Division</h3>
                <p className="chart-subtitle">Geographic distribution across 8 administrative divisions of Bangladesh</p>
              </div>
            </div>
            <div style={{ height: 360, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.division_chart || []} layout="vertical" margin={{ left: 30, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis type="number" stroke="#94a3b8" unit="%" domain={[0, 40]} />
                  <YAxis type="category" dataKey="division" stroke="#94a3b8" width={90} />
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                    formatter={(val, name, item) => [`${val}% (${item.payload.depressed}/${item.payload.total} students)`, 'Depression Rate']}
                  />
                  <Bar dataKey="depression_rate" name="Depression Rate (%)" fill="#06b6d4" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', marginTop: '1rem' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--accent-cyan)', marginBottom: '0.4rem' }}>
              Geographic Variations Note
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Rangpur (32.0%), Rajshahi (31.6%), and Khulna (31.0%) demonstrate the highest depression rates, whereas Dhaka (22.4%) and Sylhet (23.6%) exhibit lower rates. Differences may be tied to urbanization, institutional resources, campus wellness infrastructure, or local economic dynamics.
            </p>
          </div>
        </div>
      )}

      {/* 5. Numerical Correlation Matrix */}
      {activeCategory === 'correlation' && (
        <div>
          <div className="glass-panel chart-panel">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Numerical Features Correlation Heatmap</h3>
                <p className="chart-subtitle">Pearson correlation coefficients among numerical attributes and Depression</p>
              </div>
            </div>

            <div className="table-responsive" style={{ marginTop: '1rem' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    {(charts?.correlation_matrix?.columns || []).map((col, idx) => (
                      <th key={idx}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(charts?.correlation_matrix?.columns || []).map((rowName, rIdx) => (
                    <tr key={rIdx}>
                      <td style={{ fontWeight: 700, color: '#e2e8f0' }}>{rowName}</td>
                      {(charts?.correlation_matrix?.data?.[rIdx] || []).map((val, cIdx) => {
                        const isDiag = rIdx === cIdx;
                        let bg = 'transparent';
                        if (!isDiag) {
                          if (val > 0.1) bg = 'rgba(99, 102, 241, 0.25)';
                          else if (val < -0.05) bg = 'rgba(244, 63, 94, 0.2)';
                        }
                        return (
                          <td 
                            key={cIdx} 
                            style={{ 
                              background: bg,
                              fontFamily: 'monospace',
                              fontWeight: isDiag ? 800 : 500,
                              color: isDiag ? '#fff' : val < 0 ? '#fda4af' : '#a5f3fc'
                            }}
                          >
                            {val.toFixed(4)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Numerical Summary Table */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#fff' }}>
              Numerical Feature Descriptive Statistics
            </h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Mean</th>
                    <th>Median</th>
                    <th>Std Dev</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>25th Percentile</th>
                    <th>75th Percentile</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary?.numerical_summary || {}).map(([key, stats]) => (
                    <tr key={key}>
                      <td style={{ fontWeight: 600 }}>{key}</td>
                      <td>{stats.mean}</td>
                      <td>{stats.median}</td>
                      <td>{stats.std}</td>
                      <td>{stats.min}</td>
                      <td>{stats.max}</td>
                      <td>{stats.q25}</td>
                      <td>{stats.q75}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
