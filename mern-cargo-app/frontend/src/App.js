import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import ContainerList from "./pages/ContainerList";
import AddContainer from "./pages/AddContainer";
import ContainerDetail from "./pages/ContainerDetail";
import ShipMap from "./pages/ShipMap";
import AIPlacement from "./pages/AIPlacement";
import Reports from "./pages/Reports";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/containers" element={<ContainerList />} />
            <Route path="/add" element={<AddContainer />} />
            <Route path="/containers/:containerId" element={<ContainerDetail />} />
            <Route path="/ship-map" element={<ShipMap />} />
            <Route path="/ai-placement" element={<AIPlacement />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
