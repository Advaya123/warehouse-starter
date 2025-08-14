import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRole(docSnap.data().role);
        }
      }
    };

    fetchRole();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <nav className="bg-dark text-white px-6 py-4 shadow-lg flex justify-between items-center">
      {/* App Name / Logo */}
      <Link to="/dashboard" className="text-2xl font-bold text-primary">
        WarehouseApp
      </Link>

      {/* Navigation Links */}
      <div className="flex gap-6 items-center">
        <Link
          to="/dashboard"
          className="hover:text-primary transition duration-200 font-medium"
        >
          Dashboard
        </Link>

        {role === "owner" && (
          <>
            <Link
              to="/add"
              className="hover:text-primary transition duration-200 font-medium"
            >
              Add
            </Link>
            <Link
              to="/mywarehouses"
              className="hover:text-primary transition duration-200 font-medium"
            >
              My Listings
            </Link>
          </>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="text-red-400 hover:text-red-300 transition duration-200 font-medium"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
