/**
 * @fileoverview Exhaustive stop-list for preventing false-positive Indian place detection.
 */
import stopwords from './cityStopwords.json' with { type: 'json' };

export const PLACE_DETECTION_STOPLIST = new Set(stopwords);
