import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, auth } from "../../firebase";
import {
  doc, getDoc, getDocs, addDoc, collection, updateDoc, serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function WarehouseDetails() {
  const { id } = useParams();
  const [warehouse, setWarehouse] = useState(null);
  const [message, setMessage] = useState("");
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(0);
  const [newReviewText, setNewReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    const fetchWarehouse = async () => {
      const snapshot = await getDoc(doc(db, "warehouses", id));
      if (snapshot.exists()) {
        setWarehouse(snapshot.data());
      } else {
        setMessage("❌ Warehouse not found.");
      }
    };
    fetchWarehouse();
  }, [id]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        (async () => {
          try {
            const bookingSnapshot = await getDocs(collection(db, "bookings"));
            const userHasApprovedBooking = bookingSnapshot.docs.some((doc) => {
              const data = doc.data();
              return (
                data.warehouseId === id &&
                data.customerId === user.uid &&
                data.status === "approved"
              );
            });
            setCanReview(userHasApprovedBooking);
          } catch (err) {
            console.error("Error checking booking approval:", err);
            setCanReview(false);
          }
        })();
      } else {
        setCanReview(false);
      }
    });

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      const snapshot = await getDocs(collection(db, "warehouses", id, "reviews"));
      const data = snapshot.docs.map((doc) => doc.data());
      setReviews(data);
    };
    fetchReviews();
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!newRating || !newReviewText.trim()) return;

    if (!currentUser) {
      alert("❌ Please log in to submit a review.");
      return;
    }

    setSubmitting(true);
    try {
      const reviewRef = collection(db, "warehouses", id, "reviews");
      const docRef = await addDoc(reviewRef, {
        warehouseId: id,
        customerEmail: currentUser.email,
        rating: parseInt(newRating),
        review: newReviewText.trim(),
        createdAt: serverTimestamp()
      });

      const updatedReviews = [
        ...reviews,
        {
          rating: parseInt(newRating),
          review: newReviewText.trim(),
          customerEmail: currentUser.email
        }
      ];
      setReviews(updatedReviews);

      const total = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
      const avgRating = total / updatedReviews.length;

      await updateDoc(doc(db, "warehouses", id), {
        averageRating: parseFloat(avgRating.toFixed(1))
      });

      setNewRating(0);
      setNewReviewText("");
      alert("✅ Review submitted!");
    } catch (err) {
      console.error("Review submission failed:", err);
      alert("❌ Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (message) return <div className="p-6">{message}</div>;
  if (!warehouse) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">
        {warehouse.name}
      </h2>

      <img
        src={warehouse.image}
        alt={warehouse.name}
        className="w-full h-64 object-cover rounded mb-4"
      />

      <div className="space-y-2 text-gray-700 mb-6">
        <p><strong>📍 Location:</strong> {warehouse.location}</p>
        <p><strong>🏭 Industry:</strong> {warehouse.industry}</p>
        <p><strong>📐 Area:</strong> {warehouse.area} sqft</p>
        <p><strong>💰 Rent:</strong> ₹{warehouse.rent}/sqft</p>
        <p>
          <strong>🌍 Coordinates:</strong> Lat {warehouse.coordinates.lat.toFixed(4)}, Lng {warehouse.coordinates.lng.toFixed(4)}
        </p>
        <a
          className="text-blue-600 hover:underline"
          href={`https://www.google.com/maps?q=${warehouse.coordinates.lat},${warehouse.coordinates.lng}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Google Maps
        </a>
      </div>

      {/* Inquiry Form */}
<div className="mt-8 p-4 border border-gray-300 rounded bg-white text-black shadow">
  <h3 className="text-xl font-semibold mb-4 text-blue-600">📩 Send Inquiry</h3>
  <form
    onSubmit={async (e) => {
      e.preventDefault();
      const form = e.target;
      const name = form.name.value;
      const email = form.email.value;
      const message = form.message.value;

      try {
        await addDoc(collection(db, "inquiries"), {
          warehouseId: id,
          name,
          email,
          message,
          createdAt: new Date(),
        });

        alert("✅ Inquiry sent and saved!");
        form.reset();
      } catch (err) {
        console.error("Failed to submit inquiry:", err);
        alert("❌ Failed to send inquiry. Try again.");
      }
    }}
    className="space-y-3"
  >
    <input
      type="text"
      name="name"
      placeholder="Your Name"
      required
      className="w-full px-4 py-2 border border-gray-300 rounded bg-white text-black placeholder-gray-500"
    />
    <input
      type="email"
      name="email"
      placeholder="Your Email"
      required
      className="w-full px-4 py-2 border border-gray-300 rounded bg-white text-black placeholder-gray-500"
    />
    <textarea
      name="message"
      placeholder="Your Message"
      rows={4}
      required
      className="w-full px-4 py-2 border border-gray-300 rounded bg-white text-black placeholder-gray-500"
    ></textarea>
    <button
      type="submit"
      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
    >
      Send Inquiry
    </button>
  </form>
</div>



      {/* Reviews */}
      <div className="mt-10 p-4 border rounded bg-white shadow">

        {currentUser && canReview && (
          <form onSubmit={submitReview} className="space-y-2">
            <label className="block font-medium">Your Rating:</label>
            <select
              value={newRating}
              onChange={(e) => setNewRating(e.target.value)}
              required
              className="w-full border px-3 py-1 rounded"
            >
              <option value="">Select rating</option>
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>

            <textarea
              placeholder="Write a short review..."
              value={newReviewText}
              onChange={(e) => setNewReviewText(e.target.value)}
              required
              rows={3}
              className="w-full border px-3 py-2 rounded"
            ></textarea>

            <button
              type="submit"
              disabled={submitting}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}

        {currentUser && !canReview && (
          <p className="text-sm text-gray-500 italic">
            You can only submit a review in the my conversations section after your booking is approved.
          </p>
        )}
      </div>
    </div>
  );
}
