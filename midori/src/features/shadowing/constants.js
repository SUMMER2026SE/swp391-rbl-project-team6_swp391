/** Design tokens from Figma — Listening Dictation Practice */
export const SHADOWING_COLORS = {
  primary: '#42617d',
  text: '#171c1f',
  textSecondary: '#42474d',
  muted: '#73777e',
  level: '#2d666d',
  track: '#eaeef2',
  errorBg: '#ffdad6',
  errorText: '#93000a',
  correctBg: '#b1e9f0',
  correctText: '#326b71',
  correctPanelBg: 'rgba(177, 233, 240, 0.3)',
  inputPanelBg: '#f0f4f8',
  particleBar: '#a7c7e7',
  intonationBar: '#2d666d',
  border: 'rgba(194, 199, 206, 0.2)',
  cardBorder: 'rgba(255, 255, 255, 0.4)',
};

/** Spacing tuned for 13–15" laptop viewports */
export const SHADOWING_SPACING = {
  contentMaxWidth: 1120,
  sectionGap: 1.75,
  cardGap: 1,
  gridGap: 1,
};

export const DEFAULT_LESSON = {
  title: 'Audio Lesson #142: In the Train Station',
  currentTime: '00:14',
  totalTime: '00:45',
  progress: 33,
};

export const DEFAULT_TRANSCRIPTION =
  'すみません、新宿駅へ行きたいんですが、どの電車に乗ればいいですか？';

export const PRACTICE_STATS = {
  accuracy: '94.2%',
  level: 'N3',
  levelLabel: 'Advanced',
  matchScore: 88,
  intonationMatch: 92,
  particleUsage: 78,
};

/** Waveform bar heights (px) — matches Figma visualization */
export const WAVEFORM_BARS = [8, 14, 18, 22, 10, 16, 20];

export const USER_INPUT_LINES = [
  { parts: [{ text: 'すみません、新宿駅' }, { text: 'へ', highlight: 'error' }] },
  { parts: [{ text: 'きたいんですが、' }, { text: 'どの電車に', highlight: 'error' }] },
  { parts: [{ text: '乗れば', highlight: 'error' }, { text: 'いいですか？' }] },
];

export const CORRECT_TRANSCRIPT_LINES = [
  { parts: [{ text: 'すみません、新宿駅' }, { text: 'に', highlight: 'correct' }] },
  { parts: [{ text: 'きたいんですが、' }, { text: 'どの電車に', highlight: 'correct' }] },
  { parts: [{ text: '乗ったら', highlight: 'correct' }, { text: 'いいです' }, { text: 'か？' }] },
];
