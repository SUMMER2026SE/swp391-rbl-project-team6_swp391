import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_TRANSCRIPTION } from '../constants';

export function useShadowingPractice() {
  const [transcription, setTranscription] = useState(DEFAULT_TRANSCRIPTION);
  const [furiganaOn, setFuriganaOn] = useState(false);
  const [autoRepeat, setAutoRepeat] = useState(true);
  const [volume, setVolume] = useState(75);

  const characterCount = useMemo(() => transcription.length, [transcription]);

  const toggleFurigana = useCallback(() => setFuriganaOn((v) => !v), []);
  const toggleAutoRepeat = useCallback(() => setAutoRepeat((v) => !v), []);
  const clearTranscription = useCallback(() => setTranscription(''), []);
  const analyzeWithAi = useCallback(() => {
    /* API integration placeholder */
  }, []);

  return {
    transcription,
    setTranscription,
    furiganaOn,
    toggleFurigana,
    autoRepeat,
    toggleAutoRepeat,
    volume,
    setVolume,
    characterCount,
    clearTranscription,
    analyzeWithAi,
  };
}
