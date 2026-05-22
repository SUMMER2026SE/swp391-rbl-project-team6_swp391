import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import '../styles/shadowing.css';
 
/* ─── Data ──────────────────────────────────────────────────── */
const SCRIPT_LINES = [
  { jp: '今日はいい天気ですね。',  vn: 'Trời hôm nay đẹp nhỉ.' },
  { jp: '散歩に行きませんか？',    vn: 'Bạn có muốn đi dạo không?' },
  { jp: 'ええ、喜んで！',         vn: 'Vâng, tôi rất sẵn lòng!' },
  { jp: '公園まで歩きましょう。',  vn: 'Chúng ta hãy đi bộ đến công viên nhé.' },
];
 
const SCORES = [
  { label: 'RHYTHM',  value: 90 },
  { label: 'ACCENT',  value: 82 },
  { label: 'FLUENCY', value: 88 },
];
 
const BAR_HEIGHTS = [8,14,20,12,18,10,16,8,14,20,12,18,10,16,8,14,20,12,18,10,16,8,14,20,12];
 
/* ─── ScoreRing ──────────────────────────────────────────────── */
const ScoreRing = ({ value, label }) => {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="shd-score-item">
      <div className="shd-score-ring">
        <svg viewBox="0 0 80 80" width="72" height="72">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
          <circle
            cx="40" cy="40" r={r} fill="none"
            stroke="#1e3a5f" strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        </svg>
        <span className="shd-score-value">{value}</span>
      </div>
      <p className="shd-score-label">{label}</p>
    </div>
  );
};
 
/* ─── Main Page ──────────────────────────────────────────────── */
const ShadowingPractice = () => {
  const [activeLine, setActiveLine] = useState(0);
  const [scriptLang, setScriptLang] = useState('JP');
  const [recording,  setRecording]  = useState(false);
 
  return (
    <DashboardLayout>
      <div className="shd-page">
 
        {/* Hero */}
        <header className="shd-hero">
          <h1>Shadowing Practice</h1>
          <p>Improve your Japanese pronunciation and fluency with real-time AI speech analysis.</p>
        </header>
 
        {/* Outer 2-col grid */}
        <div className="shd-grid">
 
          {/* ── LEFT COLUMN ── */}
          <div className="shd-left">
 
            {/* Video */}
            <div className="shd-video">
              <div className="shd-subtitle">今日はいい天気ですね。</div>
              <div className="shd-controls">
                <div className="shd-progress"><div className="shd-progress-fill" style={{ width: '34%' }} /></div>
                <div className="shd-ctrl-row">
                  <div className="shd-ctrl-left">
                    <button className="shd-ctrl-btn">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                    <button className="shd-ctrl-btn">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
                    </button>
                    <span className="shd-time">02:45 / 08:20</span>
                  </div>
                  <div className="shd-ctrl-right">
                    <button className="shd-ctrl-btn">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 11H5v-2h7v2zm7 0h-5v-2h5v2zm0-4H5V9h14v2z"/></svg>
                    </button>
                    <button className="shd-ctrl-btn">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="#fff"><path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.01 7.01 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.47.47 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
 
            {/* ── BOTTOM ROW: Voice Lab LEFT + Scores RIGHT ── */}
            <div className="shd-bottom-row">
 
              {/* Voice Lab */}
              <div className="shd-lab">
                <p className="shd-lab-title">Voice Laboratory</p>
                <div className="shd-waveform">
                  {BAR_HEIGHTS.map((h, i) => (
                    <span
                      key={i}
                      className={recording ? 'shd-bar shd-bar--on' : 'shd-bar'}
                      style={{ height: h + 'px', animationDelay: (i * 0.04) + 's' }}
                    />
                  ))}
                </div>
                <button
                  className={recording ? 'shd-mic shd-mic--on' : 'shd-mic'}
                  onClick={() => setRecording(r => !r)}
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                </button>
                <p className="shd-mic-label">{recording ? 'RECORDING…' : 'TAP TO RECORD'}</p>
              </div>
 
              {/* Scores */}
              <div className="shd-scores">
                {SCORES.map(s => <ScoreRing key={s.label} value={s.value} label={s.label} />)}
              </div>
 
            </div>{/* end .shd-bottom-row */}
 
          </div>{/* end .shd-left */}
 
          {/* ── SCRIPT PANEL ── */}
          <aside className="shd-script">
            <div className="shd-script-head">
              <span className="shd-script-title">Script</span>
              <div className="shd-tabs">
                {['JP','VN'].map(l => (
                  <button
                    key={l}
                    className={scriptLang === l ? 'shd-tab shd-tab--on' : 'shd-tab'}
                    onClick={() => setScriptLang(l)}
                  >{l}</button>
                ))}
              </div>
            </div>
            <div className="shd-lines">
              {SCRIPT_LINES.map((line, i) => (
                <button
                  key={i}
                  className={activeLine === i ? 'shd-line shd-line--on' : 'shd-line'}
                  onClick={() => setActiveLine(i)}
                >
                  <p className="shd-line-jp">{line.jp}</p>
                  <p className="shd-line-vn">{line.vn}</p>
                </button>
              ))}
            </div>
          </aside>
 
        </div>{/* end .shd-grid */}
      </div>
    </DashboardLayout>
  );
};
 
export default ShadowingPractice;