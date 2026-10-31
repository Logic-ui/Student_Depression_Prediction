import React, { useState } from 'react';
import { 
  UserCheck, AlertCircle, CheckCircle2, AlertTriangle, 
  HelpCircle, Sparkles, RefreshCw, ArrowRight 
} from 'lucide-react';
import { predictStudentDepression } from '../services/api';

const DEFAULT_FORM = {
  Gender: 'Female',
  Age: 22,
  Family_background: 'Middle class',
  Relationship_status: 'Single',
  Marital_status: 'Unmarried',
  Living_style: 'Bachelor',
  Current_semester: 6,
  CGPA: 3.40,
  friend_circle: 'Yes',
  Health_condition: 'Normal',
  Cost_without_study: 10000,
  Home_division: 'Dhaka'
};

const SAMPLE_HIGH_RISK = {
  Gender: 'Female',
  Age: 22,
  Family_background: 'Lower Middle class',
  Relationship_status: 'Single',
  Marital_status: 'Unmarried',
  Living_style: 'Bachelor',
  Current_semester: 8,
  CGPA: 2.85,
  friend_circle: 'No',
  Health_condition: 'Critical',
  Cost_without_study: 6500,
  Home_division: 'Rangpur'
};

const SAMPLE_LOW_RISK = {
  Gender: 'Male',
  Age: 21,
  Family_background: 'Rich class',
  Relationship_status: 'In a Relationship',
  Marital_status: 'Unmarried',
  Living_style: 'Family',
  Current_semester: 4,
  CGPA: 3.85,
  friend_circle: 'Yes',
  Health_condition: 'Good',
  Cost_without_study: 18000,
  Home_division: 'Dhaka'
};

export default function Prediction() {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handlePreset = (preset) => {
    setFormData(preset);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await predictStudentDepression(formData);
      setResult(response);
    } catch (err) {
      setError(err.message || 'Prediction request failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Student Depression Prediction Assessment</h1>
        <p className="page-subtitle">
          Input student demographic, academic, health, and lifestyle parameters to evaluate statistical depression risk using the trained Gradient Boosting model.
        </p>
      </div>

      {/* Preset Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => handlePreset(SAMPLE_HIGH_RISK)}
            style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
          >
            <Sparkles size={14} color="var(--accent-rose)" />
            <span>Load Sample High-Risk Profile</span>
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => handlePreset(SAMPLE_LOW_RISK)}
            style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
          >
            <Sparkles size={14} color="var(--accent-emerald)" />
            <span>Load Sample Low-Risk Profile</span>
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => handlePreset(DEFAULT_FORM)}
            style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
          >
            <RefreshCw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <div>
            <strong>Validation or API Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Prediction Form */}
      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#fff' }}>
          Student Profile Features
        </h2>

        {/* Section 1: Demographics */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
            1. Demographics & Geographic Background
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="Gender">
                Gender <span className="form-hint">Dataset column: Gender</span>
              </label>
              <select 
                id="Gender" 
                name="Gender" 
                className="form-control" 
                value={formData.Gender} 
                onChange={handleChange}
                required
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="Age">
                Age <span className="form-hint">(15 - 40 years)</span>
              </label>
              <input 
                id="Age" 
                name="Age" 
                type="number" 
                className="form-control" 
                value={formData.Age} 
                onChange={handleChange}
                min="15" 
                max="40" 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="Home_division">
                Home Division <span className="form-hint">Home_division</span>
              </label>
              <select 
                id="Home_division" 
                name="Home_division" 
                className="form-control" 
                value={formData.Home_division} 
                onChange={handleChange}
                required
              >
                <option value="Dhaka">Dhaka</option>
                <option value="Khulna">Khulna</option>
                <option value="Rajshahi">Rajshahi</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Chittagong">Chittagong</option>
                <option value="Rangpur">Rangpur</option>
                <option value="Barisal">Barisal</option>
                <option value="Mymensingh">Mymensingh</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Health & Physical Well-being */}
        <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-rose)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
            2. Health Condition (Primary Predictive Feature)
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="Health_condition">
                Health Condition <span className="form-hint">Impacts ~70% model weight</span>
              </label>
              <select 
                id="Health_condition" 
                name="Health_condition" 
                className="form-control" 
                value={formData.Health_condition} 
                onChange={handleChange}
                required
              >
                <option value="Good">Good (Healthy, No chronic issues)</option>
                <option value="Normal">Normal (Average health)</option>
                <option value="Abnormal">Abnormal (Frequent illness, fatigue)</option>
                <option value="Critical">Critical (Severe physical / ongoing condition)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Academic Progress & Financials */}
        <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
            3. Academic Indicators & Living Cost
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="Current_semester">
                Current Semester <span className="form-hint">(0 to 16)</span>
              </label>
              <input 
                id="Current_semester" 
                name="Current_semester" 
                type="number" 
                className="form-control" 
                value={formData.Current_semester} 
                onChange={handleChange}
                min="0" 
                max="16" 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="CGPA">
                Cumulative GPA (CGPA) <span className="form-hint">(0.00 - 4.00)</span>
              </label>
              <input 
                id="CGPA" 
                name="CGPA" 
                type="number" 
                step="0.01" 
                className="form-control" 
                value={formData.CGPA} 
                onChange={handleChange}
                min="0.0" 
                max="4.0" 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="Cost_without_study">
                Living Cost (Cost_without_study) <span className="form-hint">(BDT/month)</span>
              </label>
              <input 
                id="Cost_without_study" 
                name="Cost_without_study" 
                type="number" 
                className="form-control" 
                value={formData.Cost_without_study} 
                onChange={handleChange}
                min="0" 
                max="100000" 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="Family_background">
                Family Background <span className="form-hint">Socioeconomic class</span>
              </label>
              <select 
                id="Family_background" 
                name="Family_background" 
                className="form-control" 
                value={formData.Family_background} 
                onChange={handleChange}
                required
              >
                <option value="Middle class">Middle class</option>
                <option value="Lower Middle class">Lower Middle class</option>
                <option value="Rich class">Rich class</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Social & Lifestyle Indicators */}
        <div style={{ marginBottom: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
            4. Social Dynamics & Living Style
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="Relationship_status">
                Relationship Status <span className="form-hint">Relationship_status</span>
              </label>
              <select 
                id="Relationship_status" 
                name="Relationship_status" 
                className="form-control" 
                value={formData.Relationship_status} 
                onChange={handleChange}
                required
              >
                <option value="Single">Single</option>
                <option value="In a Relationship">In a Relationship</option>
                <option value="Complicated">Complicated</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="Marital_status">
                Marital Status <span className="form-hint">Marital_status</span>
              </label>
              <select 
                id="Marital_status" 
                name="Marital_status" 
                className="form-control" 
                value={formData.Marital_status} 
                onChange={handleChange}
                required
              >
                <option value="Unmarried">Unmarried</option>
                <option value="Married">Married</option>
                <option value="Separated">Separated</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="Living_style">
                Living Style <span className="form-hint">Living_style</span>
              </label>
              <select 
                id="Living_style" 
                name="Living_style" 
                className="form-control" 
                value={formData.Living_style} 
                onChange={handleChange}
                required
              >
                <option value="Bachelor">Bachelor (Hostel / Mess / Shared flat)</option>
                <option value="Family">Family (Living at home)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="friend_circle">
                Active Friend Circle <span className="form-hint">friend_circle</span>
              </label>
              <select 
                id="friend_circle" 
                name="friend_circle" 
                className="form-control" 
                value={formData.friend_circle} 
                onChange={handleChange}
                required
              >
                <option value="Yes">Yes (Has supportive peer group)</option>
                <option value="No">No (Socially isolated / No circle)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ minWidth: '220px', padding: '0.85rem 1.75rem' }}
          >
            {loading ? (
              <span>Running Prediction...</span>
            ) : (
              <>
                <UserCheck size={18} />
                <span>Evaluate Student Risk</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Prediction Output Section */}
      {result && (
        <div className={`glass-panel result-card ${
          result.risk_level === 'High' ? 'high-risk' : result.risk_level === 'Moderate' ? 'moderate-risk' : 'low-risk'
        }`}>
          <div className="result-header">
            <div>
              <span className={`result-badge ${
                result.risk_level === 'High' ? 'high' : result.risk_level === 'Moderate' ? 'moderate' : 'low'
              }`}>
                {result.risk_level === 'High' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                {result.prediction_label} ({result.risk_level} Risk)
              </span>
              <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Classification generated by Gradient Boosting Classifier with <strong>{result.confidence_score}%</strong> confidence.
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Estimated Probability</div>
              <div style={{ fontFamily: 'Outfit', fontSize: '2.5rem', fontWeight: 800 }}>
                {result.depression_probability_percentage}%
              </div>
            </div>
          </div>

          {/* Probability Bar */}
          <div className="probability-bar-container">
            <div className="prob-meta">
              <span>Depression Risk Scale</span>
              <span>{result.depression_probability_percentage}% Probability</span>
            </div>
            <div className="prob-track">
              <div 
                className={`prob-fill ${
                  result.risk_level === 'High' ? 'high' : result.risk_level === 'Moderate' ? 'moderate' : 'low'
                }`} 
                style={{ width: `${Math.max(result.depression_probability_percentage, 5)}%` }}
              ></div>
            </div>
          </div>

          {/* Contributing Factors */}
          {result.risk_factors && result.risk_factors.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#fff' }}>
                Contributing Risk Factors Identified:
              </h4>
              <div className="factor-list">
                {result.risk_factors.map((f, i) => (
                  <div key={i} className="factor-item">
                    <span className={`severity-pill ${f.severity}`}>{f.severity}</span>
                    <div>
                      <strong>{f.factor}:</strong> {f.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#fff' }}>
                Supportive Recommendations:
              </h4>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                {result.recommendations.map((rec, i) => (
                  <li key={i} style={{ marginBottom: '0.4rem' }}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Educational Disclaimer */}
          <div className="disclaimer-banner">
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div>
              {result.disclaimer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
