import sys
import json
try:
    from faster_whisper import WhisperModel
except ImportError:
    print(json.dumps([{"text": "Error: faster_whisper not installed", "start": 0.0, "end": 0.0}]))
    sys.exit(1)

def transcribe(audio_path, model_size):
    try:
        model = WhisperModel(model_size, device='cpu', compute_type='float32')
        segments, info = model.transcribe(audio_path, beam_size=5, language='ja')
        results = []
        for segment in segments:
            results.append({
                'text': segment.text,
                'start': round(segment.start, 2),
                'end': round(segment.end, 2)
            })
        print(json.dumps(results, ensure_ascii=False))
    except Exception as e:
        print(json.dumps([{"text": str(e), "start": 0.0, "end": 0.0}]))
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(1)
    audio = sys.argv[1]
    model_sz = sys.argv[2] if len(sys.argv) > 2 else 'medium'
    transcribe(audio, model_sz)
