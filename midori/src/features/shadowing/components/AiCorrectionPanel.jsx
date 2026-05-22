import React from 'react';
import GlassCard from './GlassCard';
import JapaneseTextWithHighlights from './JapaneseTextWithHighlights';
import { SHADOWING_COLORS, USER_INPUT_LINES, CORRECT_TRANSCRIPT_LINES } from '../constants';

const SparkleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M12 2l2.4 7.2L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z"
      fill={SHADOWING_COLORS.primary}
      opacity="0.85"
    />
  </svg>
);

const AiCorrectionPanel = () => (
  <GlassCard variant="accent-left" className="shadowing-ai-correction">
    <div className="d-flex align-items-center gap-2 mb-3">
      <SparkleIcon />
      <h2 className="shadowing-card-title mb-0">AI Correction</h2>
    </div>

    <div className="row g-3">
      <div className="col-6">
        <p className="shadowing-section-label mb-1">Your Input</p>
        <div className="shadowing-text-panel shadowing-text-panel--input">
          <JapaneseTextWithHighlights lines={USER_INPUT_LINES} />
        </div>
      </div>
      <div className="col-6">
        <p className="shadowing-section-label mb-1">Correct Transcript</p>
        <div className="shadowing-text-panel shadowing-text-panel--correct">
          <JapaneseTextWithHighlights lines={CORRECT_TRANSCRIPT_LINES} />
        </div>
      </div>
    </div>
  </GlassCard>
);

export default AiCorrectionPanel;
