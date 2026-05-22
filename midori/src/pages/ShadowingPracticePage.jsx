import React from 'react';
import { Row, Col } from 'react-bootstrap';
import PageContentContainer from '../components/PageContentContainer';
import PracticeHero from '../features/shadowing/components/PracticeHero';
import AudioPlayerCard from '../features/shadowing/components/AudioPlayerCard';
import TranscriptionCard from '../features/shadowing/components/TranscriptionCard';
import AiCorrectionPanel from '../features/shadowing/components/AiCorrectionPanel';
import PerformanceAnalyticsCard from '../features/shadowing/components/PerformanceAnalyticsCard';
import { useShadowingPractice } from '../features/shadowing/hooks/useShadowingPractice';
import '../features/shadowing/styles/shadowing-practice.css';

const ShadowingPracticePage = () => {
  const {
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
  } = useShadowingPractice();

  return (
    <PageContentContainer viewport className="shadowing-practice">
      <PracticeHero />

      <Row className="g-3 align-items-stretch shadowing-layout__top">
        <Col lg={8} className="d-flex flex-column gap-3">
          <AudioPlayerCard
            volume={volume}
            onVolumeChange={setVolume}
            autoRepeat={autoRepeat}
            onToggleAutoRepeat={toggleAutoRepeat}
          />
          <TranscriptionCard
            transcription={transcription}
            onTranscriptionChange={setTranscription}
            furiganaOn={furiganaOn}
            onToggleFurigana={toggleFurigana}
            characterCount={characterCount}
            onClear={clearTranscription}
            onAnalyze={analyzeWithAi}
          />
        </Col>
        <Col lg={4}>
          <PerformanceAnalyticsCard />
        </Col>
      </Row>

      <AiCorrectionPanel />
    </PageContentContainer>
  );
};

export default ShadowingPracticePage;
