import { useState } from "react";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { Toast, useToast, FOREST, MUTED } from "../components/FormKit";
import ReviewsList, { ReviewsSummary } from "../components/ReviewsList";
import { BUSINESS_REVIEWS } from "../../Data/businessPortalMock";

// TODO: fetch from Supabase reviews table
export default function ReviewsPage() {
  const { user } = useBusinessAuth();
  const [reviews, setReviews] = useState(() => [...(BUSINESS_REVIEWS[user.id] ?? [])]);
  const [toast, setToast] = useToast();

  function handleReply(id, text) {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, reply: { text, status: "Pending Approval" } } : r)));
    // TODO: persist to Supabase on backend integration
    setToast("Reply submitted for admin approval.");
  }

  return (
    <BusinessLayout>
      <Toast message={toast} />
      <div className="flex flex-col gap-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: FOREST }}>Reviews</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>See what customers are saying and reply to their reviews.</p>
        </div>

        <ReviewsSummary reviews={reviews} />

        <p className="text-xs" style={{ color: "#9CA3AF" }}>Reviews are submitted by customers. You can reply to reviews — your reply goes to admin for approval before appearing.</p>

        <ReviewsList reviews={reviews} onReply={handleReply} />
      </div>
    </BusinessLayout>
  );
}
