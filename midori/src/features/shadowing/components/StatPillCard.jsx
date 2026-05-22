import React from 'react';

const StatPillCard = ({ label, value, valueClassName = '', variant = 'default' }) => (
  <div
    className={`shadowing-stat-pill text-center ${variant === 'level' ? 'shadowing-stat-pill--level' : ''}`}
  >
    <div className="shadowing-stat-pill__label mb-1">{label}</div>
    <div className={`shadowing-stat-pill__value ${valueClassName}`}>{value}</div>
  </div>
);

export default StatPillCard;
