import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { Link, useNavigate } from "react-router-dom";

export default function MyWarehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = auth.currentUser;
  const location = useLocation();

  useEffect(() => {
    const fetchWarehousesAndReviews = async () => {
      if (!user) return;

      try {
        const q = query(collection(db, "warehouses"), where("ownerId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const warehousesData = querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

        const reviewsSnapshot = await getDocs(collection(db, "reviews"));
        const reviews = reviewsSnapshot.docs.map((doc) => doc.data());

        const reviewsMap = {};
        reviews.forEach((review) => {
          if (!reviewsMap[review.warehouseId]) {
            reviewsMap[review.warehouseId] = [];
          }
          reviewsMap[review.warehouseId].push(review);
        });

        const enrichedWarehouses = warehousesData.map((wh) => ({
          ...wh,
          reviews: reviewsMap[wh.id] || [],
        }));

        setWarehouses(enrichedWarehouses);
      } catch (err) {
        console.error("Failed to fetch warehouses or reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWarehousesAndReviews();
  }, [user, location]);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this warehouse?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "warehouses", id));
      setWarehouses((prev) => prev.filter((wh) => wh.id !== id));
      alert("Warehouse deleted successfully.");
    } catch (err) {
      console.error("Error deleting warehouse:", err);
      alert("Failed to delete.");
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? "text-yellow-400" : "text-gray-600"}>★</span>
      );
    }
    return <div className="text-sm">{stars}</div>;
  };

  if (loading) return <p className="text-center p-4 text-gray-400">Loading your listings...</p>;

  if (warehouses.length === 0) {
    return <p className="text-center p-4 text-gray-500">You haven't added any warehouses yet.</p>;
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {warehouses.map((warehouse) => (
        <div key={warehouse.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
          {warehouse.image && (
            <img
              src={warehouse.image}
              alt={warehouse.name}
              className="w-full h-48 object-cover rounded"
            />
          )}
          <h2 className="font-bold text-xl mt-3 text-yellow-300">{warehouse.name}</h2>
          <p className="text-sm text-gray-400 mb-1">📍 {warehouse.location}</p>
          <p className="text-gray-300">Industry: {warehouse.industry}</p>
          <p className="text-gray-300">Area: {warehouse.area} sqft</p>
          <p className="text-gray-300">Rent: ₹{warehouse.rent}/sqft</p>

          {typeof warehouse.averageRating === "number" && (
            <div className="mt-2">
              {renderStars(Math.round(warehouse.averageRating))}
              <p className="text-xs text-gray-400">
                Avg Rating: {warehouse.averageRating.toFixed(1)} / 5
              </p>
            </div>
          )}

          {warehouse.reviews.length > 0 && (
            <div className="mt-2 text-sm">
              <p className="font-semibold text-gray-200">Recent Reviews:</p>
              {warehouse.reviews.slice(0, 3).map((rev, idx) => (
                <div key={idx} className="mt-1 border-t pt-1 border-gray-700 text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">{renderStars(rev.rating)}</span>
                    <span className="text-xs text-gray-500">by {rev.customerEmail}</span>
                  </div>
                  <p className="text-sm mt-1">"{rev.review}"</p>
                </div>
              ))}
            </div>
          )}

          {Array.isArray(warehouse.tags) && warehouse.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {warehouse.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-blue-900 text-blue-300 text-xs font-semibold px-2 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {warehouse.availableFrom && warehouse.availableTo && (
            <p className="text-sm text-gray-400 mt-2">
              📅 <span className="font-medium text-gray-300">Available:</span>{" "}
              {warehouse.availableFrom} → {warehouse.availableTo}
            </p>
          )}

          <div className="mt-4 flex justify-between">
            <Link
              to={`/edit/${warehouse.id}`}
              className="text-yellow-400 hover:underline font-medium"
            >
              ✏️ Edit
            </Link>
            <button
              onClick={() => handleDelete(warehouse.id)}
              className="text-red-400 hover:underline font-medium"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
