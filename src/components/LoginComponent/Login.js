import React, { useState } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { setDoc, doc } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !role)) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        console.log("✅ User created:", userCred.user.email);

        await setDoc(doc(db, "users", userCred.user.uid), {
          email,
          role,
        });

        navigate("/dashboard");
      } else {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          navigate("/dashboard");
        } catch (loginError) {
          if (loginError.code === "auth/wrong-password") {
            alert("Incorrect password. Try again.");
          } else if (loginError.code === "auth/user-not-found") {
            alert("User not found. Please sign up first.");
          } else if (loginError.code === "auth/invalid-credential") {
            alert("Please signup before logging in or Please enter valid email and password.");
          } else if (loginError.code === "auth/invalid-email") {
            alert("Please enter a valid email address.");
          } else {
            console.error("Login failed:", loginError.code);
            alert(`Login failed: ${loginError.message}`);
          }
        }
      }
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        alert("Email already in use. Please log in instead.");
      } else if (error.code === "auth/weak-password") {
        alert("Password should be at least 6 characters.");
      } else {
        console.error("Authentication error:", error.code);
        alert(`Error: ${error.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4">
      <div className="bg-[#121212] text-white w-full max-w-md p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-blue-500 text-center mb-8 -mt-2">
          Warehouse Aggregation App
        </h1>
        <h2 className="text-lg font-semibold text-center mb-6 text-gray-300">
          {isSignUp ? "Sign Up" : "Login"}
        </h2>

        <input
          className="w-full px-4 py-2 mb-4 bg-[#1e1e1e] text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full px-4 py-2 mb-4 bg-[#1e1e1e] text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {isSignUp && (
          <select
            className="w-full px-4 py-2 mb-4 bg-[#1e1e1e] text-white border border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Select Role</option>
            <option value="owner">Warehouse Owner</option>
            <option value="customer">Customer</option>
          </select>
        )}

        <button
          className="w-full bg-primary hover:bg-blue-600 text-white py-2 rounded font-semibold"
          onClick={handleAuth}
        >
          {isSignUp ? "Sign Up" : "Login"}
        </button>

        <p
          className="mt-4 text-sm text-center text-gray-400 cursor-pointer hover:text-primary"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setRole("");
          }}
        >
          {isSignUp ? "Already have an account? Log in" : "New user? Sign up"}
        </p>
      </div>
    </div>
  );
}
