import React from 'react';

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M4 7h16M4 12h16M4 17h16" stroke="#42617d" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" stroke="#42617d" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SidebarToggleButton = ({ open, onClick, className = '' }) => (
  <button
    type="button"
    className={`dashboard-sidebar-toggle d-inline-flex align-items-center justify-content-center ${className}`.trim()}
    onClick={onClick}
    aria-label={open ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
    aria-expanded={open}
  >
    {open ? <CloseIcon /> : <MenuIcon />}
  </button>
);

export default SidebarToggleButton;
