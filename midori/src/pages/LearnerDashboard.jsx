import React from 'react';
import { Row, Col, Card, ProgressBar, Button } from 'react-bootstrap';
import PageContentContainer from '../components/PageContentContainer';
import '../styles/dashboard-pages.css';

const HERO_BG =
  "url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200')";

const QUICK_ACTIONS = [
  { title: 'Flashcards', desc: 'Review 50 due cards.' },
  { title: 'JLPT Mock Exam', desc: 'Practice under pressure.' },
  { title: 'AI Chatbot', desc: 'Practice N2 grammar.' },
];

const LearnerDashboard = () => (
  <PageContentContainer viewport>
    <div className="learner-dashboard">
      <Card className="learner-dashboard__welcome" style={{ backgroundImage: HERO_BG }}>
        <Card.Body className="d-flex flex-column justify-content-center">
          <h1 className="fw-bolder">Welcome back, Kaito!</h1>
          <p className="mb-0">
            &quot;The journey of a thousand miles begins with a single kanji.&quot; Continue your path to
            N2 mastery.
          </p>
          <div className="d-flex flex-wrap gap-2 mt-2">
            <Button variant="primary" size="sm" className="rounded-pill px-3">
              Resume Last Lesson
            </Button>
            <Button variant="light" size="sm" className="rounded-pill px-3 text-primary">
              View Goals
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Row className="g-3">
        <Col md={4}>
          <Card className="learner-dashboard__metric-card">
            <h5 className="fw-bold">JLPT N2 Target</h5>
            <div className="text-center py-2">
              <div className="display-4 fw-bold text-primary">75%</div>
              <small className="text-muted">Estimated exam: Dec 2024</small>
            </div>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="learner-dashboard__metric-card">
            <h5 className="fw-bold">
              Vocabulary <span className="text-muted fs-6">📖</span>
            </h5>
            <p className="mb-2">Core Words: 1,250 / 6,000</p>
            <ProgressBar now={20} className="mb-3" style={{ height: 8 }} />
            <p className="mb-2">Kanji N2: 420 / 1,000</p>
            <ProgressBar now={42} style={{ height: 8 }} />
          </Card>
        </Col>
        <Col md={4}>
          <Card className="learner-dashboard__metric-card">
            <h5 className="fw-bold mb-3">Top Learners</h5>
            <div className="d-flex align-items-center mb-3">
              <div className="bg-secondary rounded-circle me-3 learner-dashboard__avatar" />
              <div>
                <p className="mb-0 fw-bold">Yuki-chan</p>
                <small className="text-muted">12,450 XP • N1</small>
              </div>
            </div>
            <div className="d-flex align-items-center">
              <div className="bg-secondary rounded-circle me-3 learner-dashboard__avatar" />
              <div>
                <p className="mb-0 fw-bold">Hiro.S</p>
                <small className="text-muted">10,120 XP • N2</small>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 align-items-stretch">
        <Col lg={7}>
          <Card className="learner-dashboard__streak-card h-100">
            <h5 className="fw-bold mb-3">
              14-Day Streak 🔥{' '}
              <small className="text-muted fw-normal">You&apos;re on fire! Keep it up.</small>
            </h5>
            <div className="d-flex gap-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} className="learner-dashboard__streak-day text-center">
                  {d}
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col lg={5}>
          <Row className="g-2 h-100">
            {QUICK_ACTIONS.map(({ title, desc }) => (
              <Col xs={12} sm={4} lg={12} key={title}>
                <Card className="learner-dashboard__action-card">
                  <h6 className="fw-bold">{title}</h6>
                  <p className="text-muted">{desc}</p>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </div>
  </PageContentContainer>
);

export default LearnerDashboard;
