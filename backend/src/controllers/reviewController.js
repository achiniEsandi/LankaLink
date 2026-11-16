import mongoose from 'mongoose';
import Provider from '../models/Provider.js';
import Review from '../models/Review.js';
import httpError from '../utils/httpError.js';
import { refreshRating, shortName } from '../utils/ratings.js';

const PAGE_SIZE = 10;

// Booking contract (Salpitikorala's module): documents in the "bookings" collection
// carry `customer` (User id), `provider` (Provider id) and `status`. A review is
// allowed once status is "confirmed" (see the team doc). Read directly so this
// module doesn't define or depend on the Booking model.
const bookings = () => mongoose.connection.collection('bookings');

const toId = (value, what) => {
  if (!mongoose.isValidObjectId(value)) throw httpError(404, `${what} not found`);
  return new mongoose.Types.ObjectId(String(value));
};

function publicReview(r) {
  return {
    _id: r._id,
    rating: r.rating,
    comment: r.comment,
    customerName: shortName(r.customer?.name),
    createdAt: r.createdAt,
    reply: r.reply?.text ? r.reply : undefined,
  };
}

async function distribution(providerId) {
  const rows = await Review.aggregate([
    { $match: { provider: providerId, hidden: false } },
    { $group: { _id: '$rating', n: { $sum: 1 } } },
  ]);
  return [5, 4, 3, 2, 1].map((stars) => ({ stars, count: rows.find((r) => r._id === stars)?.n ?? 0 }));
}

export async function createReview(req, res) {
  const { bookingId, rating, comment } = req.body ?? {};
  const booking = await bookings().findOne({ _id: toId(bookingId, 'Booking'), customer: req.user._id });
  if (!booking) throw httpError(404, 'Booking not found');
  if (booking.status !== 'confirmed') throw httpError(409, 'You can leave a review once the job is confirmed');

  const errors = {};
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = 'Choose 1 to 5 stars';
  if (comment !== undefined && String(comment).length > 1000) errors.comment = 'Keep it under 1000 characters';
  if (Object.keys(errors).length) throw httpError(400, 'Validation failed', errors);

  if (await Review.exists({ booking: booking._id })) throw httpError(409, 'You have already reviewed this booking');

  const review = await Review.create({
    booking: booking._id,
    provider: booking.provider,
    customer: req.user._id,
    rating,
    comment: String(comment ?? '').trim() || undefined,
  });
  const providerRating = await refreshRating(booking.provider);
  res.status(201).json({ review, providerRating });
}

// Public list for a verified provider's profile
export async function listProviderReviews(req, res) {
  const providerId = toId(req.params.id, 'Provider');
  if (!(await Provider.exists({ _id: providerId, status: 'approved' }))) throw httpError(404, 'Provider not found');

  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const filter = { provider: providerId, hidden: false };
  const [total, reviews, stars] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).populate('customer', 'name'),
    distribution(providerId),
  ]);
  res.json({ reviews: reviews.map(publicReview), distribution: stars, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) });
}

async function myProvider(req) {
  const provider = await Provider.findOne({ user: req.user._id });
  if (!provider) throw httpError(404, 'Provider profile not found');
  return provider;
}

export async function listMyReviews(req, res) {
  const provider = await myProvider(req);
  const [reviews, stars] = await Promise.all([
    Review.find({ provider: provider._id }).sort({ createdAt: -1 }).limit(50).populate('customer', 'name'),
    distribution(provider._id),
  ]);
  res.json({
    rating: provider.rating,
    distribution: stars,
    reviews: reviews.map((r) => ({ ...publicReview(r), hidden: r.hidden })),
  });
}

export async function replyToReview(req, res) {
  const provider = await myProvider(req);
  const review = await Review.findOne({ _id: toId(req.params.reviewId, 'Review'), provider: provider._id });
  if (!review) throw httpError(404, 'Review not found');
  if (review.hidden) throw httpError(409, 'This review has been hidden by LankaLink');

  const text = String(req.body?.text ?? '').trim();
  if (!text) throw httpError(400, 'Write a reply', { text: 'Write a reply' });
  if (text.length > 1000) throw httpError(400, 'Keep it under 1000 characters', { text: 'Too long' });

  review.reply = { text, at: new Date() };
  await review.save();
  res.json({ review: publicReview(await review.populate('customer', 'name')) });
}

export async function adminListReviews(req, res) {
  const filter = {};
  if (req.query.provider) filter.provider = toId(req.query.provider, 'Provider');
  if (req.query.show === 'hidden') filter.hidden = true;
  if (req.query.show === 'low') filter.rating = { $lte: 2 };

  const reviews = await Review.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('customer', 'name email')
    .populate({ path: 'provider', select: 'user', populate: { path: 'user', select: 'name' } })
    .populate('hiddenBy', 'name');

  res.json({
    reviews: reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      reply: r.reply?.text ? r.reply : undefined,
      createdAt: r.createdAt,
      customer: { name: r.customer?.name, email: r.customer?.email },
      provider: { _id: r.provider?._id, name: r.provider?.user?.name },
      hidden: r.hidden,
      hiddenReason: r.hiddenReason,
      hiddenBy: r.hiddenBy?.name,
    })),
  });
}

export async function adminSetHidden(req, res) {
  const review = await Review.findById(toId(req.params.reviewId, 'Review'));
  if (!review) throw httpError(404, 'Review not found');

  const hide = Boolean(req.body?.hidden);
  if (hide) {
    const reason = String(req.body?.reason ?? '').trim();
    if (!reason) throw httpError(400, 'Give a reason for hiding this review', { reason: 'Required' });
    review.hidden = true;
    review.hiddenReason = reason;
    review.hiddenBy = req.user._id;
  } else {
    review.hidden = false;
    review.hiddenReason = undefined;
    review.hiddenBy = undefined;
  }
  await review.save();
  const providerRating = await refreshRating(review.provider);
  res.json({ review, providerRating });
}
