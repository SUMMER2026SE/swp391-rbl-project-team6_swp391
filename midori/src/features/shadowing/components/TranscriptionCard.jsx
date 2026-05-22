import React from 'react';
import GlassCard from './GlassCard';

const TranslateIcon = () => (
  <svg width="13" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M5 8h14M12 4v16M8 20l4-4 4 4" stroke="#171c1f" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const TranscriptionCard = ({
  transcription,
  onTranscriptionChange,
  furiganaOn,
  onToggleFurigana,
  characterCount,
  onClear,
  onAnalyze,
}) => (
  <GlassCard variant="subtle" className="shadowing-transcription-card">
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
      <h2 className="shadowing-card-title mb-0">Your Transcription</h2>
      <div className="d-flex flex-wrap gap-2 align-items-center">
        <button type="button" className="shadowing-pill-btn d-flex align-items-center gap-2" onClick={onToggleFurigana}>
          <TranslateIcon />
          Furigana {furiganaOn ? 'ON' : 'OFF'}
        </button>
        <span className="shadowing-char-badge">{characterCount} Characters</span>
      </div>
    </div>

    <textarea
      className="form-control border-0 shadow-none shadowing-jp-text shadowing-jp-text--input p-2 mb-3 shadowing-transcription-area"
      rows={3}
      value={transcription}
      onChange={(e) => onTranscriptionChange(e.target.value)}
      style={{ backgroundColor: 'transparent' }}
      aria-label="Your transcription"
    />

    <div className="d-flex justify-content-end gap-2">
      <button type="button" className="shadowing-btn-ghost" onClick={onClear}>
        Clear
      </button>
      <button type="button" className="shadowing-btn-primary" onClick={onAnalyze}>
        Analyze with AI
      </button>
    </div>
  </GlassCard>
);

export default TranscriptionCard;
