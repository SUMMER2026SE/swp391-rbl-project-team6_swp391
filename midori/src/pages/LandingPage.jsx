import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import landingFuji from '../assets/landing-fuji.png';
import MidoriBrand from '../components/MidoriBrand';
import {
  FlashcardsIcon,
  VocabularyIcon,
  GrammarIcon,
  ShadowingIcon,
  ExamsIcon,
  AIChatIcon,
  DashboardIcon,
} from '../components/MidoriIcons';
import '../styles/landing-page.css';

const MIDORI_GRAY = '#333333';
const INACTIVE_NAV = '#70757a';

const FEATURES = [
  { title: 'Smart Flashcards', desc: 'Spaced repetition tailored to your memory curve.', icon: FlashcardsIcon, bg: '#fce7f3' },
  { title: 'AI Chatbot', desc: 'Natural conversations with real-time corrections.', icon: AIChatIcon, bg: '#ede9fe' },
  { title: 'Shadowing', desc: 'Mimic native speakers with video and subtitles.', icon: ShadowingIcon, bg: '#f3e8ff' },
  { title: 'Pronunciation AI', desc: 'Visual feedback on pitch accent and intonation.', icon: ShadowingIcon, bg: '#fee2e2' },
  { title: 'JLPT Exams', desc: 'Mock tests N5–N1 with score analysis.', icon: ExamsIcon, bg: '#e0e7ff' },
  { title: 'Listening Practice', desc: 'Audio clips by difficulty and topic.', icon: DashboardIcon, bg: '#cffafe' },
  { title: 'Grammar Learning', desc: 'Explanations with example sentences.', icon: GrammarIcon, bg: '#fce7f3' },
  { title: 'Vocabulary Tracking', desc: 'Mastery charts for your lexicon.', icon: VocabularyIcon, bg: '#ffedd5' },
];

const LandingPage = () => (
  <div className="landing-page">
    <Container className="landing-page__nav">
      <div className="landing-page__nav-inner d-flex justify-content-between align-items-center">
        <MidoriBrand size={44} gap={10} textSize="1.5rem" to="/" />
        <div className="d-none d-lg-flex gap-3">
          <span
            className="landing-page__nav-link fw-bold border-bottom border-2 pb-1"
            style={{ cursor: 'pointer', color: MIDORI_GRAY, borderColor: MIDORI_GRAY }}
          >
            Home
          </span>
          {['Features', 'JLPT', 'AI Learning', 'Leaderboard', 'About'].map((label) => (
            <span
              key={label}
              className="landing-page__nav-link fw-semibold"
              style={{ cursor: 'pointer', color: INACTIVE_NAV }}
            >
              {label}
            </span>
          ))}
        </div>
        <div>
          <Button variant="outline-primary" size="sm" className="me-2 rounded-pill fw-semibold border-0">
            Login
          </Button>
          <Button
            variant="info"
            size="sm"
            className="rounded-pill text-white fw-semibold"
            style={{ backgroundColor: '#00a8cc', border: 'none' }}
          >
            Register
          </Button>
        </div>
      </div>

      <Row className="landing-page__hero-section align-items-center g-3">
        <Col lg={6}>
          <h1 className="fw-bolder text-dark">
            Master Japanese with <span style={{ color: '#0077b6' }}>AI-Powered</span> Learning
          </h1>
          <p className="lead text-secondary">
            Vocabulary, shadowing, grammar, listening, and JLPT — smarter with AI.
          </p>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <Button
              variant="info"
              size="sm"
              className="rounded-pill text-white fw-semibold"
              style={{ backgroundColor: '#00a8cc', border: 'none' }}
            >
              Start Learning Free →
            </Button>
            <Button variant="light" size="sm" className="rounded-pill bg-white shadow-sm fw-semibold text-primary">
              ▶ Watch Demo
            </Button>
          </div>
          <div className="landing-page__social-proof d-flex align-items-center gap-2 bg-white rounded-pill shadow-sm d-inline-flex">
            <div className="d-flex">
              <div className="bg-primary rounded-circle" style={{ width: 28, height: 28, border: '2px solid white', zIndex: 3 }} />
              <div
                className="bg-success rounded-circle"
                style={{ width: 28, height: 28, border: '2px solid white', marginLeft: -12, zIndex: 2 }}
              />
              <div
                className="bg-warning rounded-circle"
                style={{ width: 28, height: 28, border: '2px solid white', marginLeft: -12, zIndex: 1 }}
              />
            </div>
            <span className="text-secondary fw-medium">
              <strong className="text-dark">15,420+</strong> learners
            </span>
          </div>
        </Col>
        <Col lg={6}>
          <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="bg-white p-2">
              <div className="d-flex gap-1 mb-1 px-2 pt-1">
                <div className="bg-danger rounded-circle" style={{ width: 8, height: 8 }} />
                <div className="bg-warning rounded-circle" style={{ width: 8, height: 8 }} />
                <div className="bg-success rounded-circle" style={{ width: 8, height: 8 }} />
              </div>
              <div className="landing-page__hero-image rounded-3 overflow-hidden">
                <img src={landingFuji} alt="Mount Fuji and cherry blossoms" className="w-100 h-100 object-fit-cover" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>

    <Container className="landing-page__features bg-white">
      <div className="text-center">
        <h2 className="fw-bolder text-dark">Comprehensive Tools for Mastery</h2>
        <p className="text-secondary mb-0">From beginner to JLPT N1 with intelligent algorithms.</p>
      </div>
      <Row className="g-2 mt-2">
        {FEATURES.map(({ title, desc, icon: Icon, bg }) => (
          <Col md={6} lg={3} key={title}>
            <Card className="landing-page__feature-card h-100 border-0" style={{ backgroundColor: '#f8fafc' }}>
              <Card.Body>
                <div
                  className="landing-page__feature-icon d-inline-flex align-items-center justify-content-center rounded-3"
                  style={{ backgroundColor: bg }}
                >
                  <Icon />
                </div>
                <Card.Title className="fw-bold">{title}</Card.Title>
                <Card.Text className="text-secondary">{desc}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>

    <footer className="landing-page__footer" style={{ backgroundColor: '#0b1120', color: '#94a3b8' }}>
      <Container>
        <Row className="align-items-center">
          <Col lg={5}>
            <MidoriBrand size={40} gap={8} textSize="1.25rem" darkText />
            <p className="mb-0 mt-1">Học tiếng Nhật thông minh với AI — JLPT N5 đến N1.</p>
          </Col>
          <Col lg={4}>
            <h5 className="text-white fw-bold">Khám phá</h5>
            <ul className="list-unstyled mb-0">
              <li>Smart Flashcards</li>
              <li>Thư viện Ngữ pháp</li>
              <li>Luyện Kaiwa AI</li>
            </ul>
          </Col>
          <Col lg={3}>
            <p className="mb-0">📍 FPT Đà Nẵng</p>
            <p className="mb-0">✉️ support@midori-team6.vn</p>
          </Col>
        </Row>
        <hr style={{ borderColor: '#334155' }} />
        <div className="d-flex flex-wrap justify-content-between gap-2">
          <span>© 2026 Midori — Team 6 SWP391</span>
          <span>Điều khoản · Bảo mật</span>
        </div>
      </Container>
    </footer>
  </div>
);

export default LandingPage;
