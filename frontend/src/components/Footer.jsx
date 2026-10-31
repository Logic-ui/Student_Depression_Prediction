import React from 'react';
import { AlertCircle, Heart, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
            <Shield size={18} color="var(--accent-primary)" />
            <span>Student Depression Prediction & EDA System</span>
          </div>
          <p style={{ maxWidth: '600px', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
            Developed with Scikit-learn, Flask REST API, and modern React. Trained on 4,464 authenticated student survey records to investigate academic, social, and health factors.
          </p>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', fontSize: '0.82rem' }}>
            <span>Built for academic & mental health analytics research</span>
            <Heart size={14} color="var(--accent-rose)" />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Educational Prototype &bull; Not for Clinical Diagnosis
          </span>
        </div>
      </div>
    </footer>
  );
}
