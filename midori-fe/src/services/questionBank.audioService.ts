// Audio Service for Question Bank
// This service manages audio uploads and audio library for Listening questions
// Currently uses mock data - replace with backend API later

import type { AudioItem } from "./questionBank.types";
import { formatDuration } from "./questionBank.types";

// In-memory audio library
let audioLibrary: AudioItem[] = [];

// Mock audio URLs for demo
const MOCK_AUDIO_URLS = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
];

// Initialize with mock data
function initializeAudioLibrary() {
  audioLibrary = [
    {
      id: "audio_001",
      fileName: "greeting_conversation.mp3",
      url: MOCK_AUDIO_URLS[0],
      duration: 95,
      size: 1524000,
      uploadedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: "audio_002",
      fileName: "shopping_dialogue.mp3",
      url: MOCK_AUDIO_URLS[1],
      duration: 125,
      size: 2016000,
      uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ];
}

// Initialize on module load
initializeAudioLibrary();

// Audio service API
export const audioService = {
  // Get all audio files from library
  getAll(): AudioItem[] {
    return [...audioLibrary];
  },

  // Get audio by ID
  getById(id: string): AudioItem | undefined {
    return audioLibrary.find(a => a.id === id);
  },

  // Search audio files
  search(query: string): AudioItem[] {
    const lowerQuery = query.toLowerCase();
    return audioLibrary.filter(a =>
      a.fileName.toLowerCase().includes(lowerQuery)
    );
  },

  // Upload audio (mock implementation)
  async uploadAudio(file: File): Promise<AudioItem> {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create mock URL from file
    const url = URL.createObjectURL(file);

    // Estimate duration from file (mock - in real app would use audio element)
    const duration = Math.floor(Math.random() * 180) + 30; // 30-210 seconds mock

    const newAudio: AudioItem = {
      id: `audio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      fileName: file.name,
      url,
      duration,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };

    audioLibrary = [...audioLibrary, newAudio];
    return newAudio;
  },

  // Delete audio
  deleteAudio(id: string): boolean {
    const index = audioLibrary.findIndex(a => a.id === id);
    if (index === -1) return false;

    audioLibrary = audioLibrary.filter(a => a.id !== id);
    return true;
  },

  // Get audio duration from URL (for preview)
  async getAudioDuration(url: string): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.addEventListener("loadedmetadata", () => {
        resolve(audio.duration);
      });
      audio.addEventListener("error", () => {
        resolve(0);
      });
    });
  },

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },

  // Get total audio count
  getCount(): number {
    return audioLibrary.length;
  },
};

// Audio player hook for React components
export function useAudioPlayer(url: string | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!url) return;

    const audio = new Audio(url);

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    setAudioElement(audio);

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [url]);

  const play = () => {
    if (audioElement) {
      audioElement.play();
      setIsPlaying(true);
    }
  };

  const pause = () => {
    if (audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    }
  };

  const seek = (time: number) => {
    if (audioElement) {
      audioElement.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggle = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return {
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    seek,
    toggle,
    formatTime: formatDuration,
  };
}

// Need these imports for the hook
import { useState, useEffect } from "react";
