// ─── Reading Mock Data Index ────────────────────────────────────────────────────

// Re-export all reading mock data
export * from "./extended-readings";
export * from "./exercises";
export * from "./progress";

// Import original reading mock data and combine
import { allMockReading, mockReading, mockReadingAdditional, getReadingById, getReadingByLevel, searchReading } from "../reading";
import { n5Readings, extendedReadings } from "./extended-readings";
import { n5ReadingExercises } from "./exercises";

// Create a unified reading data by merging original and extended
export const unifiedReadings = [
  ...allMockReading, // Original mock data (48 items)
  ...extendedReadings.filter(e => !allMockReading.some(o => o.id === e.id)) // Extended data (20 items N5)
];

// Combined exercises
export const allExercises = [
  ...n5ReadingExercises,
];

// Export all reading data for components
export {
  allMockReading,
  mockReading,
  mockReadingAdditional,
  extendedReadings,
  n5Readings,
  n5ReadingExercises,
  getReadingById,
  getReadingByLevel,
  searchReading,
};

// Default export
export default {
  readings: unifiedReadings,
  exercises: allExercises,
};
