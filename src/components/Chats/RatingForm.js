import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  updateDoc
} from "firebase/firestore";
import { db, auth } from "../../firebase";

export default function RatingForm({ warehouseId }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [hasBooked, setHasBooked] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const userEmail = auth.currentUser?.email;

  useEffect(() => {
    const checkBooking = async () => {
      const q = query(
        collection(db, "bookings"),
        where("warehouseId", "==", warehouseId),
        where("customerEmail", "==", userEmail),
        where("status", "==", "confirmed")
      );
      const snapshot = await getDocs(q);
      setHasBooked(!snapshot.empty);
    };
    checkBooking();
  }, [warehouseId, userEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !review) return;

    await addDoc(collection(db, "reviews"), {
      warehouseId,
      customerEmail: userEmail,
      rating: parseInt(rating),
      review,
      createdAt: serverTimestamp()
    });

    const reviewsSnap = await getDocs(
      query(collection(db, "reviews"), where("warehouseId", "==", warehouseId))
    );

    const ratings = reviewsSnap.docs.map((doc) => doc.data().rating);
    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

    await updateDoc(doc(db, "warehouses", warehouseId), {
      averageRating: avgRating
    });

    setSubmitted(true);
    setRating(0);
    setReview("");
  };

  if (!hasBooked || submitted) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-gray-100">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          ⭐ Rating (1–5):
        </label>
        <select
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-600 px-3 py-2 rounded text-white"
          required
        >
          <option value="">Select</option>
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          📝 Review:
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-600 px-3 py-2 rounded text-white"
          rows={3}
          required
        ></textarea>
      </div>

      <button
        type="submit"
        className="bg-yellow-500 text-zinc-900 font-semibold px-4 py-2 rounded hover:bg-yellow-400 transition-all"
      >
        ✅ Submit Review
      </button>
    </form>
  );
}
