// srs.js — SM-2 Spaced Repetition Algorithm

/**
 * Calculate next review schedule based on SM-2 algorithm
 * @param {Object} srsData - Current SRS data { interval, repetition, easeFactor }
 * @param {number} quality - User rating 1-5 (1=Again, 3=Hard, 4=Good, 5=Easy)
 * @returns {Object} Updated SRS data with nextReview date
 */
export function calculateSRS(srsData, quality) {
  let { interval, repetition, easeFactor } = srsData;

  if (quality >= 3) {
    // Correct response
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
  } else {
    // Incorrect response — reset
    repetition = 0;
    interval = 1;
  }

  // Update ease factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(1.3, easeFactor);

  // Calculate next review date
  const now = new Date();
  const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    interval,
    repetition,
    easeFactor: Math.round(easeFactor * 100) / 100,
    nextReview: nextReview.toISOString(),
    lastReview: now.toISOString(),
  };
}

/**
 * Check if a card is due for review
 */
export function isDue(card) {
  if (!card.srs || !card.srs.nextReview) return true;
  return new Date(card.srs.nextReview) <= new Date();
}

/**
 * Get initial SRS data for a new card
 */
export function getInitialSRS() {
  return {
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    nextReview: new Date().toISOString(),
    lastReview: null,
  };
}

/**
 * Get human-readable interval text
 */
export function intervalText(interval) {
  if (interval < 1) return 'Hôm nay';
  if (interval === 1) return '1 ngày';
  if (interval < 7) return `${interval} ngày`;
  if (interval < 30) return `${Math.round(interval / 7)} tuần`;
  if (interval < 365) return `${Math.round(interval / 30)} tháng`;
  return `${Math.round(interval / 365)} năm`;
}

/**
 * Preview what intervals each button would give
 */
export function previewIntervals(srsData) {
  return {
    again: calculateSRS({ ...srsData }, 1).interval,
    hard: calculateSRS({ ...srsData }, 3).interval,
    good: calculateSRS({ ...srsData }, 4).interval,
    easy: calculateSRS({ ...srsData }, 5).interval,
  };
}
