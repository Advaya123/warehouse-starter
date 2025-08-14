import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export default function Dashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const [warehouseCount, setWarehouseCount] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndStats = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : { role: "unknown" };

      setUserInfo({ ...userData, email: user.email });

      if (userData.role === "owner") {
        const q = query(collection(db, "warehouses"), where("ownerId", "==", user.uid));
        const snapshot = await getDocs(q);
        setWarehouseCount(snapshot.size);
      }
    };

    fetchUserAndStats();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (!userInfo) {
    return (
      <div className="h-screen flex items-center justify-center text-xl text-gray-300 bg-[#121212]">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white py-10 px-4">
      <div className="max-w-3xl mx-auto bg-[#1c1c1c] shadow-lg rounded-xl p-8 border border-gray-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-primary">👋 Welcome,</h2>
            <p className="text-lg text-gray-300">{userInfo.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-gray-800 text-white border border-gray-600 rounded-full text-sm">
              Role: {userInfo.role.toUpperCase()}
            </span>
          </div>
        </div>

        <hr className="my-6 border-gray-700" />

        {/* Owner View */}
        {userInfo.role === "owner" && (
          <>
            <div className="mb-6 bg-[#2a2a2a] p-4 rounded-lg shadow flex justify-between items-center border border-gray-700">
              <div>
                <p className="text-gray-400 text-sm">Your Listings</p>
                <h3 className="text-2xl font-bold text-white">
                  {warehouseCount !== null ? warehouseCount : "Loading..."}
                </h3>
              </div>
              <button
                onClick={() => navigate("/add")}
                className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                ➕ Add Warehouse
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate("/mywarehouses")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-lg shadow font-medium"
              >
                🗂️ My Warehouses
              </button>
              <button
                onClick={() => navigate("/browse")}
                className="bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg shadow font-medium"
              >
                🔍 Browse Warehouses
              </button>
            </div>

            <div className="mt-6 space-y-2">
              <Link
                to="/owner/inquiries"
                className="block text-blue-400 hover:underline"
              >
                📬 View Customer Inquiries
              </Link>
              <Link
                to="/my-conversations"
                className="block text-blue-400 hover:underline"
              >
                💬 My Conversations
              </Link>
            </div>
          </>
        )}

        {/* Customer View */}
        {userInfo.role === "customer" && (
          <div className="text-center">
            <p className="text-lg mb-6 text-gray-300">
              You can browse available warehouses below.
            </p>
            <button
              onClick={() => navigate("/browse")}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg font-medium shadow"
            >
              🔍 Browse All Warehouses
            </button>
            <Link
              to="/my-conversations"
              className="block mt-4 text-blue-400 hover:underline"
            >
              💬 My Conversations
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
