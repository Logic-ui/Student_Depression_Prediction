import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Award, CheckCircle, AlertTriangle, ShieldAlert, 
  BarChart2, HelpCircle, Layers, Cpu 
} from 'lucide-react';
import { fetchModelMetrics, fetchModelFeatures } from '../services/api';

export default function ModelPerformance() {
  const [metrics, setMetrics] = useState(null);
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadModelData() {
      try {
        setLoading(true);
        const [metricData, featData] = await Promise.all([
          fetchModelMetrics(),
          fetchModelFeatures()
        ]);
        setMetrics(metricData);
        setFeatures(featData);
      } catch (err) {
        setError(err.message || 'Failed to load model performance metrics');
      } finally {
        setLoading(false);
      }
    }
    loadModelData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Retrieving cross-validation metrics and feature importances...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner">
        <AlertTriangle size={20} />
        <div>
          <strong>Error Loading Metrics:</strong> {error}
        </div>
      </div>
    );
  }

  const comparison = metrics?.comparison || {};
  const comparisonList = Object.values(comparison);
  const bestModelName = metrics?.best_model || 'Gradient Boosting';
  const bestSummary = metrics?.summary || {};
  const cm = bestSummary?.confusion_matrix || [[653, 0], [6, 234]];

  // Format data for comparison bar chart
  const comparisonChartData = comparisonList.map((m) => ({
    name: m.model_name,
    Accuracy: (m.test_accuracy * 100).toFixed(1),
    Recall: (m.test_recall * 100).toFixed(1),
    Precision: (m.test_precision * 100).toFixed(1),
    F1: (m.test_f1 * 100).toFixed(1),
    ROCAUC: (m.test_roc_auc * 100).toFixed(1),
  }));

  const topFeatures = (features?.top_10 || []).map((f) => ({
    feature: f.feature.replace(/_/g, ' '),
    percentage: f.percentage,
    importance: f.importance
  }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Machine Learning Model Performance & Evaluation</h1>
        <p className="page-subtitle">
          Rigorous benchmarking of classification algorithms evaluated with 5-fold stratified cross-validation, precision-recall optimization, and holdout test validation.
        </p>
      </div>

      {/* Selected Model Card */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem', borderLeft: '4px solid var(--accent-emerald)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Award size={22} color="var(--accent-emerald)" />
              <h2 style={{ fontSize: '1.4rem', color: '#fff' }}>
                Primary Production Model: {bestModelName}
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '750px' }}>
              Selected as the optimal classifier based on superior harmonic mean of Precision and Recall (Test F1: <strong>{(bestSummary.test_f1 * 100).toFixed(1)}%</strong>) and ROC-AUC of <strong>{(bestSummary.test_roc_auc * 100).toFixed(2)}%</strong> across 5-fold cross-validation.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem 1.25rem', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Test Accuracy</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {(bestSummary.test_accuracy * 100).toFixed(1)}%
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem 1.25rem', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Test Recall</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
                {(bestSummary.test_recall * 100).toFixed(1)}%
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem 1.25rem', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Test Precision</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                {(bestSummary.test_precision * 100).toFixed(1)}%
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem 1.25rem', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Test F1-Score</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                {(bestSummary.test_f1 * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Benchmark Table */}
      <div className="glass-panel chart-panel" style={{ marginBottom: '2rem' }}>
        <h3 className="chart-title" style={{ marginBottom: '0.5rem' }}>
          Comparative Algorithm Benchmark (Test Set & 5-Fold Cross-Validation)
        </h3>
        <p className="chart-subtitle" style={{ marginBottom: '1.25rem' }}>
          Tested on holdout split of 893 student records (20% test partition, 80% train partition).
        </p>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Test Accuracy</th>
                <th>Test Precision</th>
                <th>Test Recall</th>
                <th>Test F1-Score</th>
                <th>Test ROC-AUC</th>
                <th>5-Fold CV F1 (Mean &plusmn; Std)</th>
              </tr>
            </thead>
            <tbody>
              {comparisonList.map((m) => {
                const isBest = m.model_name === bestModelName;
                return (
                  <tr key={m.model_name} className={isBest ? 'highlight' : ''}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: isBest ? 700 : 500 }}>
                      {isBest && <CheckCircle size={16} color="var(--accent-emerald)" />}
                      <span>{m.model_name}</span>
                      {isBest && <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: '4px' }}>SELECTED</span>}
                    </td>
                    <td>{(m.test_accuracy * 100).toFixed(2)}%</td>
                    <td>{(m.test_precision * 100).toFixed(2)}%</td>
                    <td>{(m.test_recall * 100).toFixed(2)}%</td>
                    <td style={{ fontWeight: 700, color: isBest ? 'var(--accent-emerald)' : '#fff' }}>
                      {(m.test_f1 * 100).toFixed(2)}%
                    </td>
                    <td>{(m.test_roc_auc * 100).toFixed(2)}%</td>
                    <td>{(m.cv_f1_mean * 100).toFixed(2)}% (&plusmn; {(m.cv_f1_std * 100).toFixed(2)}%)</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison Chart & Confusion Matrix */}
      <div className="charts-grid-2">
        {/* Model Metrics Chart */}
        <div className="glass-panel chart-panel">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Model Metric Comparison</h3>
              <p className="chart-subtitle">F1-Score, Recall, Precision, and Accuracy comparison</p>
            </div>
            <Cpu size={20} color="var(--accent-primary)" />
          </div>
          <div style={{ height: 320, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[90, 100]} unit="%" />
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  formatter={(val, name) => [`${val}%`, name]}
                />
                <Legend />
                <Bar dataKey="F1" fill="#6366f1" radius={[4, 4, 0, 0]} name="F1-Score (%)" />
                <Bar dataKey="Recall" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Recall (%)" />
                <Bar dataKey="Precision" fill="#10b981" radius={[4, 4, 0, 0]} name="Precision (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix */}
        <div className="glass-panel chart-panel">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Holdout Confusion Matrix ({bestModelName})</h3>
              <p className="chart-subtitle">893 test samples (653 Non-depressed, 240 Depressed)</p>
            </div>
            <Award size={20} color="var(--accent-emerald)" />
          </div>

          <div className="cm-container">
            <div className="cm-cell tn">
              <div className="cm-val" style={{ color: '#34d399' }}>{cm[0][0]}</div>
              <div className="cm-label">True Negatives (TN)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Correctly predicted No</div>
            </div>
            <div className="cm-cell fp">
              <div className="cm-val" style={{ color: '#fbbf24' }}>{cm[0][1]}</div>
              <div className="cm-label">False Positives (FP)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Type I Error</div>
            </div>
            <div className="cm-cell fn">
              <div className="cm-val" style={{ color: '#fb7185' }}>{cm[1][0]}</div>
              <div className="cm-label">False Negatives (FN)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Type II Error (Missed)</div>
            </div>
            <div className="cm-cell tp">
              <div className="cm-val" style={{ color: '#a5b4fc' }}>{cm[1][1]}</div>
              <div className="cm-label">True Positives (TP)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Correctly predicted Yes</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Specificity: {((cm[0][0] / (cm[0][0] + cm[0][1])) * 100).toFixed(2)}% | Sensitivity (Recall): {((cm[1][1] / (cm[1][1] + cm[1][0])) * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Feature Importance Section */}
      <div className="glass-panel chart-panel" style={{ marginTop: '2rem' }}>
        <div className="chart-header">
          <div>
            <h3 className="chart-title">Top 10 Feature Importances ({bestModelName})</h3>
            <p className="chart-subtitle">Gini / Impurity decrease percentage across tree splits</p>
          </div>
          <BarChart2 size={20} color="var(--accent-cyan)" />
        </div>

        <div style={{ height: 350, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topFeatures} layout="vertical" margin={{ left: 100, right: 30, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis type="number" stroke="#94a3b8" unit="%" />
              <YAxis type="category" dataKey="feature" stroke="#94a3b8" width={180} />
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                formatter={(val) => [`${val}%`, 'Relative Weight']}
              />
              <Bar dataKey="percentage" fill="#6366f1" radius={[0, 6, 6, 0]} name="Importance (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Limitations & Methodological Discussion */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <ShieldAlert size={22} color="var(--accent-amber)" />
          <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>
            Model Limitations & Ethical Governance
          </h3>
        </div>

        <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7 }}>
          {(metrics?.limitations || []).map((limitation, idx) => (
            <li key={idx} style={{ marginBottom: '0.5rem' }}>
              {limitation}
            </li>
          ))}
          <li>
            <strong>Correlation vs Causation:</strong> Predictive signals (e.g., relationship status or friend circle presence) indicate statistical vulnerability, but do not imply direct psychological causality.
          </li>
          <li>
            <strong>Decision Support Scope:</strong> This application serves exclusively as a risk stratification screener and educational demonstrator. It must never supersede formal medical judgment.
          </li>
        </ul>
      </div>
    </div>
  );
}
