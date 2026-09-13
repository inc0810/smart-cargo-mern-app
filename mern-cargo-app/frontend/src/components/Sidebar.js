import React from "react";
import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/", label: "Dashboard", icon: "▤", end: true },
  { to: "/containers", label: "Containers", icon: "▦" },
  { to: "/add", label: "Register Cargo", icon: "+" },
  { to: "/ship-map", label: "Ship Map", icon: "⚓" },
  { to: "/ai-placement", label: "AI Placement", icon: "✨" },
  { to: "/reports", label: "Reports", icon: "≡" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">🚢</div>
        <div className="brand-text">
          Smart Cargo
          <span>Ship Management System</span>
        </div>
      </div>
      <nav className="nav-links">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            <span>{n.icon}</span> {n.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
