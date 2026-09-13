import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getContainers } from "../api/api";

// Mirrors backend/utils/placementEngine.js SHIP_CONFIG
const SHIP = { bays: 6, rows: 4, tiers: 3 };

export default function ShipMap() {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getContainers()
      .then((res) => setContainers(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="muted">Loading ship map...</p>;

  const findAt = (bay, row, tier) =>
    containers.find(
      (c) => c.position?.bay === bay && c.position?.row === row && c.position?.tier === tier
    );

  return (
    <>
      <h1 className="page-title">Ship Map</h1>
      <p className="page-subtitle">
        Layout of {SHIP.bays} bays (bow &rarr; stern) &times; {SHIP.rows} rows (port &rarr;
        starboard), shown by tier.
      </p>

      {[3, 2, 1].map((tier) => (
        <div className="card" style={{ marginBottom: 14 }} key={tier}>
          <h3 style={{ marginTop: 0, fontSize: 14 }}>
            Tier {tier} {tier === 3 ? "(top)" : tier === 1 ? "(bottom)" : ""}
          </h3>
          <div className="ship-grid">
            {Array.from({ length: SHIP.rows }, (_, i) => SHIP.rows - i).map((row) => (
              <div className="ship-bay-row" key={row}>
                <div className="ship-bay-label">Row {row}</div>
                {Array.from({ length: SHIP.bays }, (_, i) => i + 1).map((bay) => {
                  const c = findAt(bay, row, tier);
                  if (c) {
                    return (
                      <button
                        key={bay}
                        className={`ship-slot filled ${
                          c.hasPlacementIssue || c.isOverweight ? "issue" : ""
                        }`}
                        title={`${c.containerId} · ${c.weight}kg · ${c.type} · ${c.destination}`}
                        onClick={() => navigate(`/containers/${c.containerId}`)}
                      >
                        {c.containerId.slice(-4)}
                      </button>
                    );
                  }
                  return (
                    <div className="ship-slot" key={bay}>
                      B{bay}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card">
        <strong>Legend:</strong>
        <span
          className="ship-slot filled"
          style={{ display: "inline-flex", width: 28, height: 20, margin: "0 4px" }}
        ></span>{" "}
        Placed
        <span
          className="ship-slot filled issue"
          style={{ display: "inline-flex", width: 28, height: 20, margin: "0 4px" }}
        ></span>{" "}
        Has alert
        <span
          className="ship-slot"
          style={{ display: "inline-flex", width: 28, height: 20, margin: "0 4px" }}
        ></span>{" "}
        Empty slot
      </div>
    </>
  );
}
