import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

export default function EditWarehouse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [rent, setRent] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: 28.6139, lng: 77.209 });
  const [tags, setTags] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyDoLU-QTzUNfd_z8-x2ZsvhI_leGxZRtq0",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "warehouses", id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setName(data.name);
          setSize(data.area);
          setRent(data.rent);
          setLocation(data.location);
          setCategory(data.industry);
          setImageUrl(data.image);
          setCoordinates(data.coordinates || { lat: 28.6139, lng: 77.209 });
          setTags((data.tags || []).join(", "));
          setAvailableFrom(data.availableFrom || "");
          setAvailableTo(data.availableTo || "");
        } else {
          alert("Warehouse not found.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImageUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      let updatedImageUrl = imageUrl;

      if (image) {
        const storageRef = ref(storage, `warehouses/${Date.now()}_${image.name}`);
        await uploadBytes(storageRef, image);
        updatedImageUrl = await getDownloadURL(storageRef);
      }

      const docRef = doc(db, "warehouses", id);
      await updateDoc(docRef, {
        name,
        area: size,
        rent,
        location,
        industry: category,
        image: updatedImageUrl,
        coordinates,
        tags: tags.split(",").map((tag) => tag.trim()),
        availableFrom,
        availableTo,
      });

      alert("Warehouse updated!");
      navigate("/mywarehouses");
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("Error saving changes.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this warehouse?")) return;

    try {
      await deleteDoc(doc(db, "warehouses", id));
      alert("Warehouse deleted.");
      navigate("/mywarehouses");
    } catch (error) {
      console.error("Error deleting warehouse:", error);
      alert("Failed to delete warehouse.");
    }
  };

  if (loading || !isLoaded) return <div className="p-4 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white flex justify-center items-center py-6">
      <div className="bg-[#0f172a] p-6 rounded shadow-md w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-blue-500 text-center">✏️ Edit Warehouse</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Warehouse Name"
          className="w-full p-2 mb-3 bg-gray-800 border border-gray-600 rounded text-white"
        />
        <input
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="Area (in sqft)"
          className="w-full p-2 mb-3 bg-gray-800 border border-gray-600 rounded text-white"
        />
        <input
          value={rent}
          onChange={(e) => setRent(e.target.value)}
          placeholder="Rent per sqft"
          className="w-full p-2 mb-3 bg-gray-800 border border-gray-600 rounded text-white"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location (e.g., Delhi)"
          className="w-full p-2 mb-3 bg-gray-800 border border-gray-600 rounded text-white"
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma-separated)"
          className="w-full p-2 mb-3 bg-gray-800 border border-gray-600 rounded text-white"
        />

        <div className="flex gap-4 mb-3">
          <div className="flex-1">
            <label className="block text-sm mb-1">Available From:</label>
            <input
              type="date"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Available To:</label>
            <input
              type="date"
              value={availableTo}
              onChange={(e) => setAvailableTo(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
            />
          </div>
        </div>

        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Industry (e.g., Furniture)"
          className="w-full p-2 mb-3 bg-gray-800 border border-gray-600 rounded text-white"
        />

        <label className="block mb-2">Upload Image:</label>
        <input type="file" onChange={handleImageChange} className="mb-2" />
        {imageUrl && <img src={imageUrl} alt="Preview" className="w-40 h-28 object-cover rounded mb-4" />}

        <label className="block font-medium mb-2">Select Coordinates on Map:</label>
        <GoogleMap
          zoom={10}
          center={coordinates}
          mapContainerStyle={{ height: "300px", width: "100%" }}
          onClick={(e) => setCoordinates({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
        >
          <Marker position={coordinates} />
        </GoogleMap>
        <p className="text-sm mt-2 mb-4">
          Selected: Lat {coordinates.lat.toFixed(4)} | Lng {coordinates.lng.toFixed(4)}
        </p>

        <div className="flex gap-4">
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white">
            Save Changes
          </button>
          <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
