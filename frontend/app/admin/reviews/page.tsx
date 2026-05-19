'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from '@/lib/axios';
import { FiCheck, FiX } from 'react-icons/fi';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await axios.get('/api/reviews/pending'); // using the pending route we created
        setReviews(data);
      } catch (error) {
        console.error("Failed to load reviews", error);
      }
    };
    fetchReviews();
  }, []);

  const handleApprove = async (id: string, isApproved: boolean) => {
    try {
      await axios.put(`/api/reviews/${id}/approve`, { isApproved });
      setReviews(reviews.filter((r: any) => r._id !== id));
    } catch (error) {
      console.error("Failed to update review", error);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Review Moderation Queue</h1>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 text-gray-500 p-8 rounded-lg text-center">
            No pending reviews to moderate.
          </div>
        ) : reviews.map((review: any) => (
          <div key={review._id} className="bg-white border border-gray-200 p-6 rounded-lg flex items-start gap-6 shadow-sm">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-navy-900">{review.userId?.name}</span>
                <span className="text-gray-400 text-sm">on</span>
                <Link
                  href={`/products/${review.productId?.slug || ''}`}
                  className="font-semibold text-teal-600 hover:underline"
                  target="_blank"
                >
                  {review.productId?.name}
                </Link>
              </div>
              <div className="flex items-center text-amber-400 text-sm mb-3">
                {'★'.repeat(Math.floor(review.rating))}
                <span className="text-gray-400 ml-2">{review.rating} / 5</span>
              </div>
              <p className="text-gray-700 italic border-l-4 border-gray-200 pl-4 py-1">"{review.comment}"</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => handleApprove(review._id, true)}
                className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded font-semibold hover:bg-green-200 transition-colors"
              >
                <FiCheck /> Approve
              </button>
              <button 
                onClick={() => handleApprove(review._id, false)}
                className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded font-semibold hover:bg-red-200 transition-colors"
              >
                <FiX /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
