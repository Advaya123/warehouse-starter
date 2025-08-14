import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Link } from "react-router-dom";

export default function MyConversations() {
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    const fetchChats = async () => {
      const userEmail = auth.currentUser.email;

      const q = query(
        collection(db, "messages"),
        where("participants", "array-contains", userEmail)
      );

      const snap = await getDocs(q);
      const uniqueConversations = new Map();

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const key = data.conversationId;

        if (!uniqueConversations.has(key)) {
          let warehouseName = "Unknown Warehouse";
          try {
            const warehouseDoc = await getDoc(doc(db, "warehouses", data.warehouseId));
            if (warehouseDoc.exists()) {
              warehouseName = warehouseDoc.data().name || "Unnamed";
            }
          } catch (err) {
            console.error("Error fetching warehouse:", err);
          }

          uniqueConversations.set(key, {
            warehouseId: data.warehouseId,
            warehouseName,
            customerEmail: data.customerEmail,
            ownerEmail: data.ownerEmail || "Unknown",
            conversationId: data.conversationId
          });
        }
      }

      setThreads(Array.from(uniqueConversations.values()));
    };

    fetchChats();
  }, []);

  return (
    <div className="p-6 min-h-screen bg-zinc-900 text-gray-100">
      <h2 className="text-2xl font-bold text-blue-400 mb-6">💬 My Conversations</h2>

      {threads.length === 0 ? (
        <p className="text-gray-400">You haven't started any conversations yet.</p>
      ) : (
        <ul className="space-y-4">
          {threads.map((t, index) => (
            <li
              key={index}
              className="border border-zinc-700 bg-zinc-800 p-4 rounded shadow hover:border-blue-500 transition-all"
            >
              <p className="mb-1">
                🏢 <span className="font-semibold">Warehouse:</span>{" "}
                <span className="text-blue-300">{t.warehouseName}</span>
              </p>
              <p className="mb-1 text-sm text-gray-300">
                🆔 <span className="font-medium">ID:</span> {t.warehouseId}
              </p>
              <p className="mb-1 text-sm text-gray-300">
                📧 <span className="font-medium">Customer:</span> {t.customerEmail}
              </p>
              <p className="mb-3 text-sm text-gray-300">
                👤 <span className="font-medium">Owner:</span> {t.ownerEmail}
              </p>
              <Link
                to={`/chat/${t.warehouseId}/${t.customerEmail}`}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                Open Chat
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
