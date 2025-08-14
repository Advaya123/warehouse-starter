import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { auth } from "../../firebase";
import Navbar from "./Navbar";

export default function ProtectedLayout() {
  const user = auth.currentUser;

  if (!user) return <Navigate to="/" />;

  return (
    <>
      <div className="min-h-screen bg-dark text-white">
        <Navbar />
        <Outlet />
      </div>
    </>
  );
}
