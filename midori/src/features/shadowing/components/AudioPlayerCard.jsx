import React from 'react';
import GlassCard from './GlassCard';
import { DEFAULT_LESSON, SHADOWING_COLORS, WAVEFORM_BARS } from '../constants';

const PlayIcon = () => (
  <svg width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden>
    <path d="M0 0v18l14-9L0 0z" fill="#fff" />
  </svg>
);

const SpeedIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke={SHADOWING_COLORS.textSecondary} strokeWidth="2" />
    <path d="M12 7v5l3 2" stroke={SHADOWING_COLORS.textSecondary} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const RepeatIcon = () => (
  <svg width="15" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M4 12a8 8 0 0113.66-5.66M20 12a8 8 0 01-13.66 5.66"
      stroke={SHADOWING_COLORS.primary}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path d="M16 4h4V0M8 20H4v4" stroke={SHADOWING_COLORS.primary} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const AudioPlayerCard = ({ volume, onVolumeChange, autoRepeat, onToggleAutoRepeat }) => (
  <GlassCard className="shadowing-audio-card">
    <div className="d-flex align-items-center gap-2 mb-2">
      <button type="button" className="shadowing-play-btn d-flex align-items-center justify-content-center">
        <PlayIcon />
      </button>
      <div className="flex-grow-1 min-w-0">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="fw-bold" style={{ fontSize: '0.8125rem', color: SHADOWING_COLORS.primary }}>
            {DEFAULT_LESSON.title}
          </span>
          <span className="fw-semibold" style={{ fontSize: '0.8125rem', color: SHADOWING_COLORS.muted }}>
            {DEFAULT_LESSON.currentTime} / {DEFAULT_LESSON.totalTime}
          </span>
        </div>
        <div className="d-flex align-items-end gap-1" style={{ height: 28 }}>
          <div className="shadowing-progress-track align-self-center">
            <div
              className="shadowing-progress-fill"
              style={{ width: `${DEFAULT_LESSON.progress}%` }}
            />
          </div>
          <div className="d-flex align-items-end gap-1 ms-1 flex-shrink-0">
            {WAVEFORM_BARS.map((height, i) => (
              <div
                key={i}
                className={`shadowing-waveform-bar ${i >= 3 ? 'shadowing-waveform-bar--muted' : ''}`}
                style={{ height }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>

    <div
      className="d-flex flex-wrap align-items-center justify-content-between pt-2 border-top"
      style={{ borderColor: 'rgba(194, 199, 206, 0.2) !important' }}
    >
      <div className="d-flex flex-wrap gap-3">
        <button
          type="button"
          className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-2"
          style={{ color: SHADOWING_COLORS.textSecondary, fontSize: '0.875rem', fontWeight: 600 }}
        >
          <SpeedIcon />
          0.75x Speed
        </button>
        <button
          type="button"
          className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-2"
          onClick={onToggleAutoRepeat}
          style={{
            color: autoRepeat ? SHADOWING_COLORS.primary : SHADOWING_COLORS.textSecondary,
            fontSize: '0.8125rem',
            fontWeight: autoRepeat ? 700 : 600,
          }}
        >
          <RepeatIcon />
          Auto-repeat
        </button>
      </div>
      <div className="d-flex align-items-center gap-3">
        <span className="fw-semibold" style={{ fontSize: '0.875rem', color: SHADOWING_COLORS.muted }}>
          Volume
        </span>
        <input
          type="range"
          className="shadowing-volume-range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          aria-label="Volume"
          style={{ width: 80, accentColor: SHADOWING_COLORS.primary }}
        />
      </div>
    </div>
  </GlassCard>
);

export default AudioPlayerCard;
