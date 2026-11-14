import mongoose from 'mongoose';
import { LOW_RATING_MIN_REVIEWS, LOW_RATING_THRESHOLD } from '../constants/index.js';
import Provider from '../models/Provider.js';
import Review from '../models/Review.js';

// Recalculate a provider's average and count from their visible reviews
export async function refreshRating(providerId) {
  const [stats] = await Review.aggregate([
    { $match: { provider: new mongoose.Types.ObjectId(String(providerId)), hidden: false } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const rating = stats
    ? { average: Math.round(stats.average * 10) / 10, count: stats.count }
    : { average: null, count: 0 };
  await Provider.updateOne({ _id: providerId }, { rating });
  return rating;
}

export const isLowRated = (rating) =>
  rating?.count >= LOW_RATING_MIN_REVIEWS && rating.average !== null && rating.average < LOW_RATING_THRESHOLD;

// "Kamala Perera" -> "Kamala P."
export function shortName(fullName = '') {
  const [first, ...rest] = fullName.trim().split(/\s+/);
  return rest.length ? `${first} ${rest.at(-1)[0].toUpperCase()}.` : first || 'Customer';
}
