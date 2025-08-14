import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db, auth } from "../../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";

export default function BrowseWarehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState("");

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const user = auth.currentUser;
        let userRole = "customer";
        let userId = null;

        if (user) {
          userId = user.uid;
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            userRole = userDoc.data().role || "customer";
          }
        }

        const snapshot = await getDocs(collection(db, "warehouses"));
        const warehouses = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const reviewSnapshot = await getDocs(collection(db, "reviews"));
        const allReviews = reviewSnapshot.docs.map((doc) => doc.data());

        const reviewMap = {};
        allReviews.forEach((review) => {
          const wid = review.warehouseId;
          if (!reviewMap[wid]) reviewMap[wid] = [];
          reviewMap[wid].push(review);
        });

        const enriched = warehouses.map((w) => ({
          ...w,
          reviews: reviewMap[w.id] || [],
        }));

        const filteredWarehouses =
          userRole === "owner" && userId
            ? enriched.filter((w) => w.ownerId !== userId)
            : enriched;

        setWarehouses(filteredWarehouses);
        setFiltered(filteredWarehouses);
      } catch (error) {
        console.error("Error fetching warehouses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouses();
  }, []);

  const handleFilter = () => {
    const query = search.toLowerCase();
    let results = warehouses.filter(
      (w) =>
        w.name.toLowerCase().includes(query) ||
        w.location.toLowerCase().includes(query)
    );

    if (industryFilter) {
      results = results.filter((w) => w.industry === industryFilter);
    }

    if (tagFilter.trim()) {
      const tagQuery = tagFilter.toLowerCase();
      results = results.filter((w) =>
        Array.isArray(w.tags) &&
        w.tags.some((tag) => tag.toLowerCase().includes(tagQuery))
      );
    }

    setFiltered(results);
  };

  useEffect(() => {
    handleFilter();
  }, [search, industryFilter, tagFilter, warehouses]);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? "text-yellow-400" : "text-gray-600"}>
          ★
        </span>
      );
    }
    return <div className="text-sm">{stars}</div>;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4">
      <h2 className="text-3xl font-bold text-center text-yellow-400 mb-6">🏢 Browse Warehouses</h2>

      {/* Filters */}
      <div className="bg-gray-800 p-4 mb-6 rounded-lg shadow flex flex-col md:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Search by name or location..."
          className="w-full md:w-1/2 px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring focus:ring-yellow-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="w-full md:w-1/4 px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring focus:ring-yellow-400"
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
        >
          <option value="">All Industries</option>
          <option value="FMCG">FMCG</option>
          <option value="E-Commerce">E-Commerce</option>
          <option value="Pharmaceuticals">Pharmaceuticals</option>
          <option value="Furniture">Furniture</option>
          <option value="Paint">Paint</option>
          <option value="Logistics">Logistics</option>
        </select>

        <input
          type="text"
          placeholder="Search by tag (e.g. coldstorage)"
          className="w-full md:w-1/4 px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring focus:ring-yellow-400"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
        />
      </div>

      {/* Results */}
      {loading ? (
        <p className="text-center text-gray-400">Loading warehouses...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400">No other warehouses found.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((w) => (
            <div key={w.id} className="bg-gray-800 rounded-lg shadow-lg p-4 hover:shadow-xl transition duration-200">
              <img
                src={w.image}
                alt={w.name}
                className="w-full h-48 object-cover rounded mb-3"
              />
              <h3 className="text-xl font-bold text-yellow-300">{w.name}</h3>
              <p className="text-sm text-gray-300 mb-1">📍 {w.location}</p>
              <p className="text-sm text-gray-300">Industry: {w.industry}</p>
              <p className="text-sm text-gray-300">Area: {w.area} sqft</p>
              <p className="text-sm text-gray-300">Rent: ₹{w.rent}/sqft</p>

              {/* ⭐ Average Rating */}
              {typeof w.averageRating === "number" && (
                <div className="mt-2">
                  {renderStars(Math.round(w.averageRating))}
                  <p className="text-xs text-gray-400">
                    Avg Rating: {w.averageRating.toFixed(1)} / 5
                  </p>
                </div>
              )}

              {Array.isArray(w.reviews) && w.reviews.length > 0 && (
                <div className="mt-3 border-t border-gray-700 pt-2 text-sm text-gray-300">
                  <p className="font-semibold mb-1 text-yellow-300">Recent Reviews:</p>
                  {w.reviews.slice().reverse().slice(0, 2).map((r, i) => (
                    <div key={i} className="mb-1">
                      <div className="flex items-center gap-1">
                        {renderStars(r.rating)}
                        <span className="text-xs text-gray-500">– {r.customerEmail}</span>
                      </div>
                      <p className="text-sm">{r.review}</p>
                    </div>
                  ))}
                </div>
              )}

              {Array.isArray(w.reviews) && w.reviews.length === 0 && (
                <p className="text-xs text-gray-500 mt-2">No reviews yet.</p>
              )}

              {w.tags && (
                <p className="text-sm text-gray-400 mt-1">
                  🏷️ Tags: {Array.isArray(w.tags) ? w.tags.join(", ") : w.tags}
                </p>
              )}

              {w.availableFrom && w.availableTo && (
                <p className="text-sm text-gray-400 mt-1">
                  📅 Available: {w.availableFrom} → {w.availableTo}
                </p>
              )}

              <Link
                to={`/warehouse/${w.id}`}
                className="text-yellow-400 text-sm hover:underline block mt-3"
              >
                🔍 View Details
              </Link>

              {w.coordinates?.lat && w.coordinates?.lng && (
                <a
                  href={`https://www.google.com/maps?q=${w.coordinates.lat},${w.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-400 text-sm hover:underline block"
                >
                  📍 View on Google Maps
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
