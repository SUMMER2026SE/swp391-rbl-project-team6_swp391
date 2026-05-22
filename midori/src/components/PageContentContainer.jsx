import React from 'react';

/**
 * Wrapper for dashboard pages. `viewport` = balanced spacing inside scrollable outlet.
 */
const PageContentContainer = ({ children, className = '', viewport = false, fit = false }) => {
  const modeClass = viewport || fit ? 'dashboard-page-content--viewport' : '';
  return <div className={`dashboard-page-content ${modeClass} ${className}`.trim()}>{children}</div>;
};

export default PageContentContainer;
