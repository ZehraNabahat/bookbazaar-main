'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import SEOHead from '@/components/SEOHead';

export default function MyReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchReviews = async () => {
      try {
        const { data } = await axios.get('/api/reviews/me');
        setReviews(data);
      } catch (err) {
        console.error('Failed to load your reviews', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [user]);

  if (authLoading) {
    return <p className="text-center py-20 text-gray-500">Loading...</p>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center card p-8">
        <SEOHead title="My Reviews | BookBazaar" description="Your product reviews" metaRobots="noindex,nofollow" />
        <h1 className="text-2xl font-bold mb-4">Please log in</h1>
        <Link href="/login?redirect=/my-reviews" className="btn-primary">Log In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <SEOHead title="My Reviews | BookBazaar" description="Your product reviews" metaRobots="noindex,nofollow" />
      <h1 className="text-3xl font-bold text-navy-900 mb-2">My Reviews</h1>
      <p className="text-gray-600 mb-8">Reviews you have submitted for books you purchased.</p>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : reviews.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <p className="mb-4">You have not written any reviews yet.</p>
          <Link href="/products" className="btn-primary inline-block">Browse Books</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article key={review._id} className="card p-6">
              <div className="flex justify-between items-start gap-4 mb-2">
                <Link
                  href={`/products/${review.productId?.slug || ''}`}
                  className="font-bold text-teal-600 hover:underline"
                >
                  {review.productId?.name || 'Product'}
                </Link>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    review.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {review.isApproved ? 'Published' : 'Pending approval'}
                </span>
              </div>
              <div className="text-amber-400 text-sm mb-2">
                {'★'.repeat(Math.round(review.rating))}
                <span className="text-gray-400 ml-2">{review.rating}/5</span>
              </div>
              <p className="text-gray-700">{review.comment}</p>
              <p className="text-xs text-gray-400 mt-3">{new Date(review.createdAt).toLocaleString()}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
