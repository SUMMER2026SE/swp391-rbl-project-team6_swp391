import React from 'react';
import { Link } from 'react-router-dom';
import midoriLogo from '../assets/midori-logo.png';

const MIDORI_GRAY = '#333333';

export const MidoriBrand = ({
  size = 52,
  showText = true,
  textSize,
  gap = 10,
  to,
  className = '',
  textColor = MIDORI_GRAY,
  darkText = false,
}) => {
  const labelSize = textSize ?? (size >= 56 ? '1.875rem' : size >= 48 ? '1.625rem' : '1.375rem');

  const content = (
    <div
      className={`d-flex align-items-center ${className}`}
      style={{ gap, textDecoration: 'none', minHeight: size }}
    >
      <img
        src={midoriLogo}
        alt="Midori"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          flexShrink: 0,
          display: 'block',
        }}
      />
      {showText && (
        <span
          className="fw-bold"
          style={{
            fontSize: labelSize,
            color: darkText ? '#e2e8f0' : textColor,
            letterSpacing: '-0.5px',
            lineHeight: 1.1,
            marginTop: 2,
          }}
        >
          Midori
        </span>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="text-decoration-none d-inline-flex">
        {content}
      </Link>
    );
  }

  return content;
};

export default MidoriBrand;
