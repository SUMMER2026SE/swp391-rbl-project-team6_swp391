import React from 'react';

const wrap = (children) => (
  <span
    className="d-inline-flex align-items-center justify-content-center"
    style={{ width: 24, height: 24, flexShrink: 0 }}
  >
    {children}
  </span>
);

export const DashboardIcon = () =>
  wrap(
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="13" width="4.5" height="8" rx="1.2" fill="#e91e8c" />
      <rect x="9.75" y="8" width="4.5" height="13" rx="1.2" fill="#34a853" />
      <rect x="16.5" y="3" width="4.5" height="18" rx="1.2" fill="#4285f4" />
    </svg>
  );

export const FlashcardsIcon = () =>
  wrap(
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="4" fill="#f06292" />
      <path d="M8 14l4-5 4 5H8z" fill="white" />
      <circle cx="12" cy="10" r="2" fill="white" opacity="0.9" />
    </svg>
  );

export const VocabularyIcon = () =>
  wrap(
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="4" fill="#f06292" />
      <text x="12" y="16.5" textAnchor="middle" fill="white" fontSize="12" fontWeight="800" fontFamily="Inter, Arial, sans-serif">
        A
      </text>
    </svg>
  );

export const GrammarIcon = () =>
  wrap(
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="8" width="11" height="11" rx="2.5" fill="#34a853" />
      <rect x="8" y="5" width="11" height="11" rx="2.5" fill="#ea4335" />
      <rect x="11" y="10" width="11" height="11" rx="2.5" fill="#4285f4" />
    </svg>
  );

export const ShadowingIcon = () =>
  wrap(
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="5.5" fill="#7e57c2" />
      <path d="M5.5 18.5c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" fill="#7e57c2" />
      <path d="M15.5 14.5c1.2.2 2.2 1 2.8 2.2" stroke="#b39ddb" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17.5 12c1.8.3 3.1 1.4 3.6 3" stroke="#b39ddb" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19.5 9.5c2.2.5 3.6 2 4 4" stroke="#b39ddb" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );

export const ExamsIcon = () =>
  wrap(
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="3" width="11" height="15" rx="2" fill="#ffffff" stroke="#dadce0" strokeWidth="1.2" />
      <line x1="8" y1="7.5" x2="13" y2="7.5" stroke="#9aa0a6" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="8" y1="10.5" x2="12" y2="10.5" stroke="#9aa0a6" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M13.5 14.5l5.5 5.5" stroke="#fb8c00" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M15.5 12.5l4.5 2.5-2.5 4.5-4-2 2-5z" fill="#fdd835" stroke="#fb8c00" strokeWidth="0.8" />
    </svg>
  );

export const AIChatIcon = () =>
  wrap(
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="6" y="7" width="12" height="11" rx="3.5" fill="#8e24aa" />
      <circle cx="10" cy="12" r="1.6" fill="#42a5f5" />
      <circle cx="14" cy="12" r="1.6" fill="#42a5f5" />
      <rect x="9.5" y="15" width="5" height="1.6" rx="0.8" fill="#e1bee7" />
      <rect x="3.5" y="10" width="2.2" height="5" rx="1.1" fill="#f48fb1" />
      <rect x="18.3" y="10" width="2.2" height="5" rx="1.1" fill="#f48fb1" />
      <rect x="10" y="4" width="4" height="3.2" rx="1.2" fill="#ab47bc" />
      <circle cx="12" cy="5.2" r="0.8" fill="#ce93d8" />
    </svg>
  );

export const FEATURE_ICONS = {
  dashboard: DashboardIcon,
  flashcards: FlashcardsIcon,
  vocabulary: VocabularyIcon,
  grammar: GrammarIcon,
  shadowing: ShadowingIcon,
  exams: ExamsIcon,
  aiChat: AIChatIcon,
};
