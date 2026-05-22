import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';

const HomePage = () => (
  <div
    className="d-flex flex-column align-items-center justify-content-center text-center px-3"
    style={{ minHeight: '100dvh', fontFamily: 'Inter, sans-serif' }}
  >
    <h1 className="fw-bold mb-2" style={{ fontSize: '1.75rem' }}>
      Chào mừng đến với Midori
    </h1>
    <p className="text-secondary mb-3" style={{ fontSize: '0.9375rem' }}>
      Nền tảng học tiếng Nhật với AI
    </p>
    <div className="d-flex gap-2">
      <Button as={Link} to="/" variant="outline-primary" size="sm" className="rounded-pill">
        Trang chủ
      </Button>
      <Button as={Link} to="/dashboard" variant="primary" size="sm" className="rounded-pill">
        Vào Dashboard
      </Button>
    </div>
  </div>
);

export default HomePage;
