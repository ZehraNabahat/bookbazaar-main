'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import axios from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

interface ProductReviewsProps {
  productId: string;
  productName: string;
  productSlug: string;
}

export default function ProductReviews({ productId, productName, productSlug }: ProductReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<{ canReview: boolean; reason?: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadReviews = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/products/${productId}/reviews`);
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const loadEligibility = useCallback(async () => {
    if (!user) {
      setEligibility(null);
      return;
    }
    try {
      const { data } = await axios.get(`/api/products/${productId}/reviews/eligibility`);
      setEligibility(data);
    } catch {
      setEligibility({ canReview: false, reason: 'Could not check review eligibility.' });
    }
  }, [productId, user]);

  useEffect(() => {
    loadReviews();
    loadEligibility();
  }, [loadReviews, loadEligibility]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');
    try {
      const { data } = await axios.post(`/api/products/${productId}/reviews`, { rating, comment });
      setFeedback(data.message || 'Review submitted!');
      setComment('');
      setRating(5);
      await loadReviews();
      await loadEligibility();
    } catch (err: any) {
      setFeedback(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const loginRedirect = `/login?redirect=${encodeURIComponent(`/products/${productSlug}#reviews`)}`;

  return (
    <section id="reviews" className="mt-10 bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-navy-900 mb-6">Customer Reviews</h2>
      <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-bold text-navy-900 mb-3">Write a review</h3>
        {!user ? (
          <p className="text-gray-600 text-sm">
            <Link href={loginRedirect} className="text-teal-600 font-semibold hover:underline">Log in</Link>
            {' '}to leave a review for {productName}.
          </p>
        ) : eligibility?.canReview ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)} className={`text-2xl ${star <= rating ? 'text-amber-400' : 'text-gray-300'}`}>★</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your review</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} required rows={4} className="input-field w-full" placeholder="Share your experience with this book..." />
            </div>
            {feedback && <p className="text-sm text-teal-700">{feedback}</p>}
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Submitting...' : 'Submit Review'}</button>
          </form>
        ) : (
          <p className="text-gray-600 text-sm">{eligibility?.reason || 'Checking eligibility...'}</p>
        )}
      </div>
      {loading ? (
        <p className="text-gray-500 text-center py-6">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500 text-center py-6">No reviews yet. Be the first to review this book!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article key={review._id} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-navy-900">{review.userId?.name || 'Buyer'}</span>
                <time className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</time>
              </div>
              <div className="text-amber-400 text-sm mb-2">{'★'.repeat(Math.round(review.rating))}<span className="text-gray-400 ml-2">{review.rating}/5</span></div>
              <p className="text-gray-700">{review.comment}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
