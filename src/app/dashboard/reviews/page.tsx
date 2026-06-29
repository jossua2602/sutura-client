'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { Star, Loader2, MessageSquare } from 'lucide-react';
import Modal from '@/components/Modal';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Review {
  id: number;
  user: User;
  rating: number;
  comment: string | null;
  reply: string | null;
  is_featured: boolean;
  created_at: string;
}

export default function ReviewsPage() {
  const { shop } = useAuthStore();
  const toast = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [filterRating, setFilterRating] = useState<string>('');

  // Modals
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!shop?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (filterRating) params.append('rating', filterRating);

      const res = await api.get(`/shops/${shop.id}/reviews?${params.toString()}`);
      setReviews(res.data.data.data);
      setLastPage(res.data.data.last_page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [shop, page, filterRating]);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      void fetchReviews();
    }, 0);

    return () => globalThis.clearTimeout(timer);
  }, [fetchReviews]);

  const handleToggleFeature = async (review: Review) => {
    if (!shop) return;
    try {
      await api.put(`/shops/${shop.id}/reviews/${review.id}`, {
        is_featured: !review.is_featured
      });
      fetchReviews();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update featured status.');
    }
  };

  const handleReplySubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!shop || !currentReview) return;
    setSubmitting(true);
    try {
      await api.put(`/shops/${shop.id}/reviews/${currentReview.id}`, {
        reply: replyText
      });
      setReplyModalOpen(false);
      fetchReviews();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit reply.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!shop || !confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.delete(`/shops/${shop.id}/reviews/${reviewId}`);
      fetchReviews();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete review.');
    }
  };

  const renderReviewsContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-48 text-[#A8A19A]">
          <Loader2 className="animate-spin w-8 h-8" />
        </div>
      );
    }

    if (reviews.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-[#A8A19A]">
          <Star className="w-12 h-12 mb-3 opacity-20" />
          <p>No reviews found.</p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-[#EBE6E0]">
        {reviews.map(review => (
          <div key={review.id} className="p-6 transition-colors hover:bg-[#FAF6F3]/50">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              
              {/* Review Content */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EBE6E0] flex items-center justify-center font-bold text-[#524A44]">
                    {review.user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-[#2D2A26] leading-tight">{review.user.name}</p>
                    <p className="text-xs text-[#A8A19A]">{new Date(review.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star} 
                      size={16} 
                      className={star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} 
                    />
                  ))}
                </div>

                <p className="text-[#524A44] leading-relaxed">
                  {review.comment || <span className="italic text-gray-400">No written comment provided.</span>}
                </p>

                {/* Shop Reply */}
                {review.reply && (
                  <div className="mt-4 bg-[#F0EAE3]/50 border-l-2 border-taupe p-4 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare size={14} className="text-taupe" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-taupe">Shop Response</span>
                    </div>
                    <p className="text-[#524A44] text-sm">{review.reply}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end gap-3 min-w-[140px]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFeature(review)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors border flex items-center gap-1.5 ${
                      review.is_featured 
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                        : 'bg-white text-[#827A73] border-[#EBE6E0] hover:bg-[#F0EAE3]'
                    }`}
                  >
                    <Star size={12} className={review.is_featured ? 'fill-amber-500 text-amber-500' : ''} />
                    {review.is_featured ? 'Featured' : 'Feature'}
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentReview(review);
                      setReplyText(review.reply || '');
                      setReplyModalOpen(true);
                    }}
                    className="text-xs font-medium text-taupe hover:underline"
                  >
                    {review.reply ? 'Edit Reply' : 'Reply'}
                  </button>
                  <span className="text-[#EBE6E0]">|</span>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="text-xs font-medium text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Shop Reviews</h1>
          <p className="text-[#827A73] text-sm mt-1">Manage and feature customer feedback</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterRating}
            onChange={(e) => {
              setFilterRating(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-white border border-[#EBE6E0] rounded-lg text-sm text-[#524A44] shadow-sm focus:outline-none focus:border-taupe"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#EBE6E0] overflow-hidden">
        {renderReviewsContent()}
        
        {/* Pagination */}
        {lastPage > 1 && (
          <div className="p-4 border-t border-[#EBE6E0] bg-[#FAF6F3] flex justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-1.5 rounded-lg border border-[#D1C7BD] bg-white text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-1.5 text-sm text-[#524A44] font-medium">Page {page} of {lastPage}</span>
            <button
              disabled={page === lastPage}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-1.5 rounded-lg border border-[#D1C7BD] bg-white text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      <Modal isOpen={replyModalOpen} onClose={() => setReplyModalOpen(false)} title="Respond to Review">
        <form onSubmit={handleReplySubmit} className="space-y-4">
          <div className="p-4 bg-[#FAF6F3] rounded-lg border border-[#EBE6E0]">
            <p className="text-sm italic text-[#524A44]">&quot;{currentReview?.comment}&quot;</p>
          </div>
          <div className="space-y-1">
            <label htmlFor="review-reply-input" className="text-sm font-medium text-[#524A44]">Your Reply</label>
            <textarea
              id="review-reply-input"
              required
              rows={4}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Thank the customer or address their feedback..."
              className="w-full px-4 py-2 border border-[#EBE6E0] rounded-lg focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe bg-white"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#EBE6E0]">
            <button
              type="button"
              onClick={() => setReplyModalOpen(false)}
              className="px-4 py-2 text-sm text-[#524A44] hover:text-[#2D2A26] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-taupe hover:bg-taupe/90 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Save Reply
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
