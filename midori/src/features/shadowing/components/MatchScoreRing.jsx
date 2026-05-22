import React from 'react';
import { SHADOWING_COLORS } from '../constants';

const MatchScoreRing = ({ score, compact = false }) => {
  const ringSize = compact ? 96 : 128;
  const ringRadius = compact ? 38 : 52;
  const strokeWidth = compact ? 8 : 10;
  const ringCenter = ringSize / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      className={`position-relative mx-auto shadowing-match-ring ${compact ? 'shadowing-match-ring--compact' : ''}`}
    >
      <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`} aria-hidden>
        <circle
          cx={ringCenter}
          cy={ringCenter}
          r={ringRadius}
          fill="none"
          stroke={SHADOWING_COLORS.track}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={ringCenter}
          cy={ringCenter}
          r={ringRadius}
          fill="none"
          stroke={SHADOWING_COLORS.primary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${ringCenter} ${ringCenter})`}
        />
      </svg>
      <div className="position-absolute top-50 start-50 translate-middle text-center">
        <div className={`fw-bold shadowing-match-ring__value ${compact ? 'shadowing-match-ring__value--compact' : ''}`}>
          {score}%
        </div>
        <div className="text-uppercase shadowing-match-ring__label">Match Score</div>
      </div>
    </div>
  );
};

export default MatchScoreRing;
