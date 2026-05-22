import React from 'react';
import { SHADOWING_COLORS } from '../constants';

const MetricProgressBar = ({ label, value, fillColor }) => (
  <div>
    <div className="d-flex justify-content-between align-items-center mb-2">
      <span className="fw-semibold" style={{ fontSize: '0.8125rem', color: SHADOWING_COLORS.textSecondary }}>
        {label}
      </span>
      <span className="fw-bold" style={{ fontSize: '0.8125rem', color: SHADOWING_COLORS.text }}>
        {value}%
      </span>
    </div>
    <div className="shadowing-metric-track">
      <div
        className="shadowing-metric-fill"
        style={{ width: `${value}%`, backgroundColor: fillColor }}
      />
    </div>
  </div>
);

export default MetricProgressBar;
