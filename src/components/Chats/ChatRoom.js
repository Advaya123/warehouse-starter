import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import RatingForm from "./RatingForm";
import { db, auth } from "../../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  doc,
  serverTimestamp
} from "firebase/firestore";

export default function ChatRoom() {
  const { warehouseId, customerEmail } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [warehouse, setWarehouse] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [pendingBookings, setPendingBookings] = useState([]);

  const userEmail = auth.currentUser?.email;
  const conversationId = `${warehouseId}_${customerEmail}`;
  const isCustomer = userEmail === customerEmail;

  useEffect(() => {
    const fetchWarehouse = async () => {
      const warehouseDoc = await getDoc(doc(db, "warehouses", warehouseId));
      if (warehouseDoc.exists()) {
        setWarehouse(warehouseDoc.data());
      }
    };
    fetchWarehouse();
  }, [warehouseId]);

  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => doc.data());
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
    if (!isCustomer) {
      const q = query(
        collection(db, "bookings"),
        where("warehouseId", "==", warehouseId),
        where("status", "==", "pending")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const pending = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setPendingBookings(pending);
      });

      return () => unsubscribe();
    }
  }, [isCustomer, warehouseId]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    const senderRole = isCustomer ? "customer" : "owner";
    const finalOwnerEmail = warehouse?.ownerEmail || (!isCustomer ? userEmail : "unknown@example.com");

    await addDoc(collection(db, "messages"), {
      warehouseId,
      customerEmail,
      ownerId: auth.currentUser.uid,
      ownerEmail: finalOwnerEmail,
      participants: [customerEmail, finalOwnerEmail],
      sender: senderRole,
      conversationId,
      text,
      createdAt: serverTimestamp()
    });

    setText("");
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingStatus("");

    if (!startDate || !duration) {
      setBookingStatus("❌ Please fill in both fields.");
      return;
    }

    const newStart = new Date(startDate);
    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + parseInt(duration));

    const existingBookingsSnap = await getDocs(
      query(
        collection(db, "bookings"),
        where("warehouseId", "==", warehouseId),
        where("status", "in", ["pending", "confirmed"])
      )
    );

    const hasConflict = existingBookingsSnap.docs.some((doc) => {
      const booking = doc.data();
      const existingStart = new Date(booking.startDate);
      const existingEnd = new Date(existingStart);
      existingEnd.setDate(existingEnd.getDate() + parseInt(booking.duration));
      return newStart < existingEnd && newEnd > existingStart;
    });

    if (hasConflict) {
      setBookingStatus("❌ This date range overlaps with an existing booking.");
      return;
    }

    const finalOwnerEmail = warehouse?.ownerEmail || (!isCustomer ? userEmail : "unknown@example.com");

    try {
      await addDoc(collection(db, "bookings"), {
        warehouseId,
        customerEmail: userEmail,
        ownerEmail: finalOwnerEmail,
        startDate,
        duration,
        createdAt: serverTimestamp(),
        status: "pending"
      });

      await addDoc(collection(db, "messages"), {
        warehouseId,
        customerEmail,
        ownerId: auth.currentUser.uid,
        ownerEmail: finalOwnerEmail,
        participants: [customerEmail, finalOwnerEmail],
        sender: "system",
        conversationId,
        text: `📦 ${customerEmail} requested a booking from ${startDate} for ${duration} day(s).`,
        createdAt: serverTimestamp()
      });

      setBookingStatus("✅ Booking requested successfully!");
      setStartDate("");
      setDuration("");
    } catch (error) {
      console.error("Booking error:", error);
      setBookingStatus("❌ Failed to submit booking.");
    }
  };

  const handleBookingAction = async (bookingId, action, booking) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: action
      });

      const systemMsg =
        action === "confirmed"
          ? `✅ Booking confirmed from ${booking.startDate} for ${booking.duration} day(s).`
          : `❌ Booking rejected for ${booking.startDate}.`;

      await addDoc(collection(db, "messages"), {
        warehouseId,
        customerEmail: booking.customerEmail,
        ownerId: auth.currentUser.uid,
        ownerEmail: booking.ownerEmail,
        participants: [booking.customerEmail, booking.ownerEmail],
        sender: "system",
        conversationId,
        text: systemMsg,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error updating booking:", err);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto min-h-screen bg-zinc-900 text-gray-100">
      <h2 className="text-xl font-bold mb-4 text-blue-400">
        💬 Chat with {isCustomer ? "Warehouse Owner" : customerEmail}
      </h2>

      <div className="border border-zinc-700 rounded p-4 bg-zinc-800 h-96 overflow-y-scroll mb-4 flex flex-col gap-2">
        {messages.map((msg, index) => {
          const isCurrentUser =
            (msg.sender === "owner" && !isCustomer) ||
            (msg.sender === "customer" && isCustomer);

          return (
            <div
              key={index}
              className={`max-w-xs px-3 py-2 rounded-lg shadow text-sm ${
                isCurrentUser
                  ? "ml-auto bg-blue-600 text-white"
                  : "mr-auto bg-zinc-700 text-gray-100"
              }`}
            >
              <span className="block font-semibold mb-1">
                {isCurrentUser
                  ? "You"
                  : msg.sender === "owner"
                  ? "Owner"
                  : msg.sender === "system"
                  ? "System"
                  : "Customer"}
              </span>
              <p>{msg.text}</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mb-6">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-zinc-600 rounded bg-zinc-800 text-white"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>

      {isCustomer && warehouse?.availableFrom && warehouse?.availableTo && (
        <div className="bg-zinc-800 border border-zinc-700 p-4 rounded shadow mb-6">
          <h3 className="text-lg font-bold mb-3 text-green-400">📦 Book this Warehouse</h3>
          <p className="text-sm text-gray-300 mb-3">
            Available from <strong>{warehouse.availableFrom}</strong> to{" "}
            <strong>{warehouse.availableTo}</strong>
          </p>

          {bookingStatus && (
            <p
              className={`mb-2 ${
                bookingStatus.startsWith("✅")
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {bookingStatus}
            </p>
          )}

          <form onSubmit={handleBooking} className="space-y-2">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date:</label>
              <input
                type="date"
                className="w-full border border-zinc-600 px-3 py-1 rounded bg-zinc-900 text-white"
                min={warehouse.availableFrom}
                max={warehouse.availableTo}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Duration (days):</label>
              <input
                type="number"
                className="w-full border border-zinc-600 px-3 py-1 rounded bg-zinc-900 text-white"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
            >
              ✅ Book Now
            </button>
          </form>
        </div>
      )}

      {!isCustomer && pendingBookings.length > 0 && (
        <div className="bg-zinc-800 border border-zinc-700 p-4 rounded shadow">
          <h3 className="text-lg font-bold mb-3 text-orange-400">🔔 Pending Bookings</h3>
          {pendingBookings.map((booking) => (
            <div key={booking.id} className="mb-3 border border-zinc-600 p-3 rounded shadow-sm">
              <p><strong>From:</strong> {booking.customerEmail}</p>
              <p><strong>Start:</strong> {booking.startDate}</p>
              <p><strong>Duration:</strong> {booking.duration} days</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleBookingAction(booking.id, "confirmed", booking)}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => handleBookingAction(booking.id, "rejected", booking)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCustomer && (
        <div className="mt-6 bg-zinc-800 border border-zinc-700 p-4 rounded shadow">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">⭐ Rate this Warehouse</h3>
          <RatingForm warehouseId={warehouseId} />
        </div>
      )}
    </div>
  );
}
