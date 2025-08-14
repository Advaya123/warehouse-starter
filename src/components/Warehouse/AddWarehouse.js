import React, { useState } from "react";
import { db, storage, auth } from "../../firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

export default function AddWarehouse() {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [rent, setRent] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [coordinates, setCoordinates] = useState({ lat: 28.6139, lng: 77.2090 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [tags, setTags] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const navigate = useNavigate();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyDoLU-QTzUNfd_z8-x2ZsvhI_leGxZRtq0",
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
      setMessage("❌ Please select a valid image file.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!name || !area || !rent || !industry || !location || !imageFile) {
      setMessage("❌ Please fill all fields and upload an image.");
      setLoading(false);
      return;
    }

    if (isNaN(area) || isNaN(rent)) {
      setMessage("❌ Area and Rent must be numeric values.");
      setLoading(false);
      return;
    }

    if (new Date(availableFrom) > new Date(availableTo)) {
      setMessage("❌ 'Available From' date cannot be later than 'Available To'.");
      setLoading(false);
      return;
    }

    try {
      const imageRef = ref(storage, `warehouse-images/${Date.now()}-${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      const imageURL = await getDownloadURL(imageRef);

      await addDoc(collection(db, "warehouses"), {
        name,
        area: parseFloat(area),
        rent: parseFloat(rent),
        industry,
        location,
        image: imageURL,
        coordinates,
        ownerId: auth.currentUser.uid,
        ownerEmail: auth.currentUser.email,
        createdAt: new Date(),
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        availableFrom,
        availableTo
      });

      setMessage("✅ Warehouse added successfully!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      console.error("Error:", err);
      setMessage("❌ Failed to add warehouse. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-dark text-white flex justify-center items-start pt-12 px-4">
      <div className="bg-gray-900 shadow-xl p-8 rounded-xl w-full max-w-2xl border border-gray-700">
        <h2 className="text-3xl font-bold mb-6 text-center text-primary">
          ➕ Add New Warehouse
        </h2>

        {message && (
          <p className={`mb-4 text-center font-medium ${message.startsWith("✅") ? "text-green-500" : "text-red-400"}`}>
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Warehouse Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-800 text-white border border-gray-600 px-4 py-2 rounded" />

          <input type="text" placeholder="Area (in sqft)" value={area} onChange={(e) => setArea(e.target.value)} className="w-full bg-gray-800 text-white border border-gray-600 px-4 py-2 rounded" />

          <input type="text" placeholder="Rent per sqft" value={rent} onChange={(e) => setRent(e.target.value)} className="w-full bg-gray-800 text-white border border-gray-600 px-4 py-2 rounded" />

          <input type="text" placeholder="Location (e.g., Karnal, Delhi)" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-gray-800 text-white border border-gray-600 px-4 py-2 rounded" />

          <input type="text" placeholder="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full bg-gray-800 text-white border border-gray-600 px-4 py-2 rounded" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Available From:</label>
              <input type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} className="w-full bg-gray-800 text-white border border-gray-600 px-4 py-2 rounded" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Available To:</label>
              <input type="date" value={availableTo} onChange={(e) => setAvailableTo(e.target.value)} className="w-full bg-gray-800 text-white border border-gray-600 px-4 py-2 rounded" />
            </div>
          </div>

          <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full bg-gray-800 text-white border border-gray-600 px-4 py-2 rounded">
            <option value="">Select Industry</option>
            <option value="FMCG">FMCG</option>
            <option value="E-Commerce">E-Commerce</option>
            <option value="Pharmaceuticals">Pharmaceuticals</option>
            <option value="Furniture">Furniture</option>
            <option value="Paint">Paint</option>
            <option value="Logistics">Logistics</option>
          </select>

          <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-white" />

          {imagePreview && (
            <div className="mt-2">
              <p className="text-sm text-gray-400 mb-1">Image Preview:</p>
              <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover rounded border border-gray-700" />
            </div>
          )}

          {/* Map Picker */}
          {isLoaded && (
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Select Coordinates on Map:</label>
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "300px" }}
                center={coordinates}
                zoom={10}
                onClick={(e) =>
                  setCoordinates({
                    lat: e.latLng.lat(),
                    lng: e.latLng.lng(),
                  })
                }
              >
                <Marker position={coordinates} />
              </GoogleMap>
              <p className="text-sm mt-2 text-gray-300">
                📍 Lat: {coordinates.lat.toFixed(4)}, Lng: {coordinates.lng.toFixed(4)}
              </p>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-2 rounded">
            {loading ? "Uploading..." : "✅ Add Warehouse"}
          </button>

          <button type="button" onClick={() => navigate("/dashboard")} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded">
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
