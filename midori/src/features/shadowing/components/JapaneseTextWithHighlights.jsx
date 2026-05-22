import React from 'react';

const JapaneseTextWithHighlights = ({ lines }) => (
  <div className="shadowing-jp-text">
    {lines.map((line, lineIndex) => (
      <p key={lineIndex} className="mb-0">
        {line.parts.map((part, partIndex) =>
          part.highlight ? (
            <span
              key={partIndex}
              className={`shadowing-highlight--${part.highlight}`}
            >
              {part.text}
            </span>
          ) : (
            <span key={partIndex}>{part.text}</span>
          )
        )}
      </p>
    ))}
  </div>
);

export default JapaneseTextWithHighlights;
