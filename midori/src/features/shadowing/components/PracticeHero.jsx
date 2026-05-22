import React from 'react';
import StatPillCard from './StatPillCard';
import { PRACTICE_STATS } from '../constants';

const PracticeHero = () => (
  <header className="shadowing-hero d-flex flex-wrap align-items-end justify-content-between gap-3">
    <div className="min-w-0">
      <h1 className="shadowing-practice__hero-title mb-1">Listening Dictation Practice</h1>
      <p className="shadowing-practice__hero-subtitle mb-0">
        Improve your Japanese listening by typing what you hear — with AI-powered correction.
      </p>
    </div>
    <div className="d-flex flex-wrap gap-2">
      <StatPillCard label="Accuracy" value={PRACTICE_STATS.accuracy} />
      <StatPillCard
        label="Level"
        value={
          <>
            {PRACTICE_STATS.level}
            <span className="d-block" style={{ fontSize: '0.85em', fontWeight: 600 }}>
              {PRACTICE_STATS.levelLabel}
            </span>
          </>
        }
        valueClassName="shadowing-stat-pill__value--level"
        variant="level"
      />
    </div>
  </header>
);

export default PracticeHero;
