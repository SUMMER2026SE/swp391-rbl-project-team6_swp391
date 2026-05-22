import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import midoriLogo from '../assets/midori-logo.png';

const LearnerNavbar = () => {
  return (
    <Navbar bg="success" variant="dark" expand="lg" className="shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/dashboard" className="d-flex align-items-center gap-2 py-0 fw-bold">
          <img src={midoriLogo} alt="Midori logo" style={{ height: '40px', width: 'auto' }} />
          Midori
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="learner-navbar-nav" />
        <Navbar.Collapse id="learner-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard">Bảng điều khiển</Nav.Link>
            <Nav.Link as={Link} to="/vocabulary">Từ vựng</Nav.Link>
            <Nav.Link as={Link} to="/flashcards">Flashcards</Nav.Link>
            <Nav.Link as={Link} to="/grammar">Ngữ pháp</Nav.Link>
            <Nav.Link as={Link} to="/kaiwa">Kaiwa</Nav.Link>
          </Nav>
          <Nav>
            <Navbar.Text className="me-3 text-white">
              Xin chào, <strong>Học viên</strong>
            </Navbar.Text>
            <Button variant="outline-light" size="sm">Đăng xuất</Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default LearnerNavbar;