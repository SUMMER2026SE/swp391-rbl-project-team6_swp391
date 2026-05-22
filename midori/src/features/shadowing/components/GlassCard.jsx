import React from 'react';

const GlassCard = ({ children, className = '', variant = 'default', compact = false }) => {
  const variantClass =
    variant === 'subtle'
      ? 'shadowing-glass-card--subtle'
      : variant === 'accent-left'
        ? 'shadowing-glass-card--accent-left'
        : '';

  return (
    <div className={`shadowing-glass-card ${compact ? 'p-2' : 'p-3'} ${variantClass} ${className}`.trim()}>
      {children}
    </div>
  );
};

export default GlassCard;
