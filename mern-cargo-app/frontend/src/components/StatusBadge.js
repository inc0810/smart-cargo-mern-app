import React from "react";

const CLASS_MAP = {
  Registered: "badge-registered",
  Loaded: "badge-loaded",
  InTransit: "badge-intransit",
  Unloaded: "badge-unloaded",
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${CLASS_MAP[status] || "badge-registered"}`}>{status}</span>;
}
