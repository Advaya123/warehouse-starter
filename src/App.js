import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/LoginComponent/Login";
import Dashboard from "./components/DashboardComponent/Dashboard";
import AddWarehouse from "./components/Warehouse/AddWarehouse";
import EditWarehouse from "./components/Warehouse/EditWarehouse";
import MyWarehouses from "./components/Warehouse/MyWarehouses";
import BrowseWarehouses from "./components/Warehouse/BrowseWarehouses";
import WarehouseDetails from "./components/Warehouse/WarehouseDetails";
import OwnerInquiries from "./components/Chats/OwnerInquiries";
import ChatRoom from "./components/Chats/ChatRoom";
import MyConversations from "./components/Chats/MyConversations";
import ProtectedLayout from "./components/NavigationBar/ProtectedLayout";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add" element={<AddWarehouse />} />
        <Route path="/mywarehouses" element={<MyWarehouses />} />
        <Route path="/edit/:id" element={<EditWarehouse />} />
        <Route path="/owner/inquiries" element={<OwnerInquiries />} />
        <Route path="/chat/:warehouseId/:customerEmail" element={<ChatRoom />} />
        <Route path="/my-conversations" element={<MyConversations />} />
        <Route path="/browse" element={<BrowseWarehouses />} />
        <Route path="/warehouse/:id" element={<WarehouseDetails />} />
      </Route>
    </Routes>
  );
}

export default App;
