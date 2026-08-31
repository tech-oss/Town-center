import { useEffect, useState } from "react";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { Toast, useToast, FOREST, MUTED } from "../components/FormKit";
import ReviewsList from "../components/ReviewsList";
import { listReviews, addReview, updateReview, deleteReview, replyToReview } from "../api/businessReviews";

export default function ReviewsPage() {
  const { user } = useBusinessAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listReviews(user.id).then((data) => {
      if (!cancelled) { setReviews(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [user.id]);

  async function handleReply(id, text) {
    await replyToReview(id, text);
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, reply: { text, status: "Pending Approval" } } : r)));
    setToast("Reply submitted for admin approval.");
  }

  async function handleAdd(form) {
    const created = await addReview(user.id, form);
    setReviews((prev) => [created, ...prev]);
    setToast("Review added.");
  }
  async function handleUpdate(id, form) {
    await updateReview(id, form);
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...form } : r)));
    setToast("Review updated.");
  }
  async function handleDelete(id) {
    await deleteReview(id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setToast("Review deleted.");
  }

  return (
    <BusinessLayout>
      <Toast message={toast} />
      <div className="flex flex-col gap-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: FOREST }}>Reviews</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Manage your customer reviews and reply to them.</p>
        </div>

        <p className="text-xs" style={{ color: "#9CA3AF" }}>Add, edit or remove reviews for your business, and reply to reviews — your reply goes to admin for approval before appearing.</p>

        {loading ? (
          <p className="text-sm" style={{ color: MUTED }}>Loading reviews…</p>
        ) : (
          <ReviewsList reviews={reviews} onReply={handleReply} onAdd={handleAdd} onUpdate={handleUpdate} onDelete={handleDelete} />
        )}
      </div>
    </BusinessLayout>
  );
}
