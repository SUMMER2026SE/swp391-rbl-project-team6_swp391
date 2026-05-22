import { useState, useCallback } from 'react';
import PageContentContainer from '../components/PageContentContainer';
import '../styles/shadowing-page.css';

/* ───────────────── Data ───────────────── */
const SCRIPT_LINES = [
  { jp: '今日はいい天気ですね。', vn: 'Trời hôm nay đẹp nhỉ.' },
  { jp: '散歩に行きませんか？', vn: 'Bạn có muốn đi dạo không?' },
  { jp: 'ええ、喜んで！', vn: 'Vâng, tôi rất sẵn lòng!' },
  { jp: '公園まで歩きましょう。', vn: 'Chúng ta hãy đi bộ đến công viên nhé.' },
];

const SCORES = [
  { label: 'RHYTHM', value: 90, variant: 'rhythm' },
  { label: 'ACCENT', value: 82, variant: 'accent' },
  { label: 'FLUENCY', value: 88, variant: 'fluency' },
];

const VIDEO_POSTER =
  'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80';

/* ───────────────── SVG Icons ───────────────── */
const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M6 4l16 8-16 8V4z" fill="#fff" />
  </svg>
);

const RepeatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M4 12a8 8 0 0113.66-5.66M20 12a8 8 0 01-13.66 5.66" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 4h4V0M8 20H4v4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const VolumeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M11 5L6 9H2v6h4l5 4V5z" fill="#fff" />
    <path d="M15 9a4 4 0 010 6M18 6a8 8 0 010 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const FullscreenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M3 8V5a2 2 0 012-2h3M16 3h3a2 2 0 012 2v3M21 16v3a2 2 0 01-2 2h-3M8 21H5a2 2 0 01-2-2v-3" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PipIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="4" width="20" height="16" rx="2" stroke="#fff" strokeWidth="2" />
    <rect x="12" y="12" width="8" height="6" rx="1" fill="#fff" opacity="0.7" />
  </svg>
);

const MicIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="9" y="2" width="6" height="12" rx="3" fill="#fff" />
    <path d="M5 10a7 7 0 0014 0" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 18v4M8 22h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const StopIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="6" y="6" width="12" height="12" rx="2" fill="#fff" />
  </svg>
);

/* ───────────────── Score Ring ───────────────── */
const ScoreRing = ({ value, variant, label }) => {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="shd-score-item">
      <div className="shd-score-ring">
        <svg viewBox="0 0 80 80">
          <circle className="shd-score-ring__track" cx="40" cy="40" r={radius} />
          <circle
            className={`shd-score-ring__fill shd-score-ring__fill--${variant}`}
            cx="40"
            cy="40"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="shd-score-ring__value">{value}</span>
      </div>
      <span className="shd-score-label">{label}</span>
    </div>
  );
};

/* ───────────────── Video Player ───────────────── */
const VideoPlayer = ({ activeLine }) => {
  const currentTime = '02:45';
  const totalTime = '08:20';
  const progress = 33;

  return (
    <div className="shd-video-card">
      <div className="shd-video-card__frame">
        <img
          className="shd-video-card__poster"
          src={VIDEO_POSTER}
          alt="Japanese cityscape"
        />
        <div className="shd-video-card__subtitle">
          {SCRIPT_LINES[activeLine].jp}
        </div>
        <div className="shd-video-card__progress-wrap">
          <div className="shd-video-card__progress-track">
            <div className="shd-video-card__progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="shd-video-card__controls">
          <div className="shd-video-card__controls-left">
            <button type="button" className="shd-video-card__ctrl-btn" aria-label="Play">
              <PlayIcon />
            </button>
            <button type="button" className="shd-video-card__ctrl-btn" aria-label="Repeat">
              <RepeatIcon />
            </button>
            <button type="button" className="shd-video-card__ctrl-btn" aria-label="Volume">
              <VolumeIcon />
            </button>
            <span className="shd-video-card__time">
              {currentTime} / {totalTime}
            </span>
          </div>
          <div className="shd-video-card__controls-right">
            <button type="button" className="shd-video-card__ctrl-btn" aria-label="Picture in Picture">
              <PipIcon />
            </button>
            <button type="button" className="shd-video-card__ctrl-btn" aria-label="Fullscreen">
              <FullscreenIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ───────────────── Voice Laboratory ───────────────── */
const VoiceLaboratory = () => {
  const [recording, setRecording] = useState(false);

  const toggleRecording = useCallback(() => {
    setRecording((r) => !r);
  }, []);

  return (
    <div className="shd-voice-lab">
      <h3 className="shd-voice-lab__title">Voice Laboratory</h3>

      <div className="shd-waveform">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="shd-waveform__bar"
            style={recording ? undefined : { animationPlayState: 'paused' }}
          />
        ))}
      </div>

      <button
        type="button"
        className={`shd-record-btn ${recording ? 'shd-record-btn--active' : ''}`}
        aria-label={recording ? 'Stop recording' : 'Start recording'}
        onClick={toggleRecording}
      >
        {recording ? <StopIcon /> : <MicIcon />}
      </button>

      <p className="shd-record-label">
        {recording ? 'Recording…' : 'Tap to record'}
      </p>
    </div>
  );
};

/* ───────────────── Script Panel ───────────────── */
const ScriptPanel = ({ activeLine, onLineClick }) => {
  const [tab, setTab] = useState('jp');

  return (
    <div className="shd-script-panel">
      <div className="shd-script-panel__header">
        <h3 className="shd-script-panel__title">Script</h3>
        <div className="shd-script-panel__tabs">
          <button
            type="button"
            className={`shd-script-panel__tab ${tab === 'jp' ? 'shd-script-panel__tab--active' : ''}`}
            onClick={() => setTab('jp')}
          >
            JP
          </button>
          <button
            type="button"
            className={`shd-script-panel__tab ${tab === 'vn' ? 'shd-script-panel__tab--active' : ''}`}
            onClick={() => setTab('vn')}
          >
            VN
          </button>
        </div>
      </div>

      <div className="shd-script-panel__lines">
        {SCRIPT_LINES.map((line, idx) => (
          <div
            key={idx}
            className={`shd-script-line ${idx === activeLine ? 'shd-script-line--active' : ''}`}
            onClick={() => onLineClick(idx)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onLineClick(idx)}
          >
            <div className="shd-script-line__index">#{idx + 1}</div>
            <div className="shd-script-line__jp">{line.jp}</div>
            {tab === 'jp' && <div className="shd-script-line__vn">{line.vn}</div>}
            {tab === 'vn' && <div className="shd-script-line__vn">{line.vn}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ───────────────── Page ───────────────── */
const ShadowingPage = () => {
  const [activeLine, setActiveLine] = useState(0);

  return (
    <PageContentContainer viewport className="shadowing-page">
      {/* Hero */}
      <header className="shadowing-page__hero">
        <h1>Shadowing Practice</h1>
        <p>
          Improve your Japanese pronunciation and fluency with real-time AI speech analysis.
        </p>
      </header>

      {/* Main grid */}
      <div className="shadowing-page__grid">
        {/* Left column */}
        <div className="shadowing-page__left">
          <VideoPlayer activeLine={activeLine} />
          <VoiceLaboratory />
        </div>

        {/* Right column */}
        <ScriptPanel activeLine={activeLine} onLineClick={setActiveLine} />
      </div>

      {/* Score rings */}
      <div className="shd-scores" role="presentation">
        {SCORES.map((s) => (
          <ScoreRing key={s.label} {...s} />
        ))}
      </div>
    </PageContentContainer>
  );
};

export default ShadowingPage;
