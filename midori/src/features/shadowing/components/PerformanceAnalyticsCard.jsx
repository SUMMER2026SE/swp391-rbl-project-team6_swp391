import React from 'react';
import GlassCard from './GlassCard';
import MatchScoreRing from './MatchScoreRing';
import MetricProgressBar from './MetricProgressBar';
import { PRACTICE_STATS, SHADOWING_COLORS } from '../constants';

const PerformanceAnalyticsCard = () => (
  <GlassCard variant="subtle" className="h-100 shadowing-analytics-card d-flex flex-column">
    <p className="shadowing-section-label mb-3">Performance Analytics</p>
    <MatchScoreRing score={PRACTICE_STATS.matchScore} />
    <div className="d-flex flex-column gap-3 mt-3">
      <MetricProgressBar
        label="Intonation Match"
        value={PRACTICE_STATS.intonationMatch}
        fillColor={SHADOWING_COLORS.intonationBar}
      />
      <MetricProgressBar
        label="Particle Usage"
        value={PRACTICE_STATS.particleUsage}
        fillColor={SHADOWING_COLORS.particleBar}
      />
    </div>
  </GlassCard>
);

export default PerformanceAnalyticsCard;
