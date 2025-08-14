import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db, auth } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "firebase/firestore";

export default function OwnerInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInquiries = async () => {
      setLoading(true);

      try {
        const warehousesSnap = await getDocs(
          query(collection(db, "warehouses"), where("ownerId", "==", auth.currentUser.uid))
        );
        const ownedWarehouses = warehousesSnap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));

        const warehouseMap = Object.fromEntries(ownedWarehouses.map(w => [w.id, w.name]));

        const allInquiries = [];
        for (let w of ownedWarehouses) {
          const q = query(
            collection(db, "inquiries"),
            where("warehouseId", "==", w.id),
            orderBy("createdAt", "desc")
          );
          const snap = await getDocs(q);
          snap.forEach((doc) => {
            allInquiries.push({
              id: doc.id,
              ...doc.data(),
              warehouseName: warehouseMap[w.id],
            });
          });
        }

        setInquiries(allInquiries);
      } catch (err) {
        console.error("Failed to fetch inquiries:", err);
      }

      setLoading(false);
    };

    fetchInquiries();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-zinc-900 text-gray-100">
      <h2 className="text-2xl font-bold text-blue-400 mb-6">📬 Customer Inquiries</h2>

      {loading ? (
        <p className="text-gray-400">Loading inquiries...</p>
      ) : inquiries.length === 0 ? (
        <p className="text-gray-400">No inquiries found.</p>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className="bg-zinc-800 border border-zinc-700 p-4 rounded shadow hover:border-blue-500 transition-all"
            >
              <h3 className="text-lg font-semibold text-white mb-1">
                🏢 {inquiry.warehouseName}
              </h3>
              <p className="text-sm text-gray-300 mb-1">
                <strong className="text-gray-400">From:</strong>{" "}
                {inquiry.name} ({inquiry.email})
              </p>
              <p className="text-sm text-gray-200 whitespace-pre-line">
                {inquiry.message}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Submitted on:{" "}
                {inquiry.createdAt?.toDate?.().toLocaleString() ?? "Unknown"}
              </p>
              <Link
                to={`/chat/${inquiry.warehouseId}/${encodeURIComponent(inquiry.email)}`}
                className="inline-block mt-3 text-blue-400 hover:underline text-sm"
              >
                💬 Open Chat
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
