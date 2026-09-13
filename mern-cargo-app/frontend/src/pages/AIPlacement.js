import React, { useEffect, useState } from "react";
import { getContainers, suggestPlacement, placeContainer } from "../api/api";

export default function AIPlacement() {
  const [containers, setContainers] = useState([]);
  const [mode, setMode] = useState("existing");
  const [selectedId, setSelectedId] = useState("");
  const [hypothetical, setHypothetical] = useState({
    weight: "",
    size: "20ft",
    type: "Dry",
    unloadingPriority: 1,
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getContainers().then((res) => {
      setContainers(res.data);
      const unplaced = res.data.filter((c) => !c.position?.bay);
      if (unplaced.length) setSelectedId(unplaced[0].containerId);
    });
  }, []);

  const unplaced = containers.filter((c) => !c.position?.bay);

  async function runSuggestion() {
    setError("");
    setResult(null);
    try {
      if (mode === "existing") {
        if (!selectedId) return;
        const res = await suggestPlacement({ containerId: selectedId });
        setResult(res.data);
      } else {
        const res = await suggestPlacement({
          weight: Number(hypothetical.weight) || 0,
          size: hypothetical.size,
          type: hypothetical.type,
          unloadingPriority: Number(hypothetical.unloadingPriority) || 1,
        });
        setResult(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to get suggestion.");
    }
  }

  async function applySuggestion() {
    if (!result?.position || mode !== "existing") return;
    try {
      await placeContainer(selectedId, result.position);
      setResult(null);
      const res = await getContainers();
      setContainers(res.data);
      const stillUnplaced = res.data.filter((c) => !c.position?.bay);
      setSelectedId(stillUnplaced[0]?.containerId || "");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to apply placement.");
    }
  }

  return (
    <>
      <h1 className="page-title">AI Cargo Placement</h1>
      <p className="page-subtitle">
        Rule-based placement engine — recommends where a container should go based on weight,
        size, type, destination and unloading order.
      </p>
      <div className="card">
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button
            className={`btn btn-sm ${mode === "existing" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => {
              setMode("existing");
              setResult(null);
            }}
          >
            Unplaced Container
          </button>
          <button
            className={`btn btn-sm ${mode === "hypothetical" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => {
              setMode("hypothetical");
              setResult(null);
            }}
          >
            Hypothetical Cargo
          </button>
        </div>

        {mode === "existing" ? (
          unplaced.length === 0 ? (
            <p className="muted">
              All registered containers already have a position. Register more cargo or switch to
              "Hypothetical Cargo".
            </p>
          ) : (
            <div className="form-field" style={{ maxWidth: 360 }}>
              <label>Choose an unplaced container</label>
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                {unplaced.map((c) => (
                  <option key={c.containerId} value={c.containerId}>
                    {c.containerId} — {c.weight}kg, {c.type}, {c.destination}
                  </option>
                ))}
              </select>
            </div>
          )
        ) : (
          <div className="form-grid">
            <div className="form-field">
              <label>Weight (kg)</label>
              <input
                type="number"
                value={hypothetical.weight}
                onChange={(e) => setHypothetical((h) => ({ ...h, weight: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Size</label>
              <select
                value={hypothetical.size}
                onChange={(e) => setHypothetical((h) => ({ ...h, size: e.target.value }))}
              >
                <option value="20ft">20 ft</option>
                <option value="40ft">40 ft</option>
                <option value="45ft">45 ft</option>
              </select>
            </div>
            <div className="form-field">
              <label>Type</label>
              <select
                value={hypothetical.type}
                onChange={(e) => setHypothetical((h) => ({ ...h, type: e.target.value }))}
              >
                <option>Dry</option>
                <option>Reefer</option>
                <option>Hazardous</option>
                <option>Liquid</option>
                <option value="OpenTop">Open Top</option>
              </select>
            </div>
            <div className="form-field">
              <label>Unloading Priority</label>
              <input
                type="number"
                min="1"
                value={hypothetical.unloadingPriority}
                onChange={(e) =>
                  setHypothetical((h) => ({ ...h, unloadingPriority: e.target.value }))
                }
              />
            </div>
          </div>
        )}

        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={runSuggestion}>
          ✨ Suggest Placement
        </button>

        {error && <div className="alert-banner alert-danger">{error}</div>}

        {result && (
          <div className="reasoning-box">
            {result.position ? (
              <>
                <strong>
                  Recommended slot: Bay {result.position.bay}, Row {result.position.row}, Tier{" "}
                  {result.position.tier}
                </strong>
                <p style={{ margin: "6px 0" }}>{result.reasoning}</p>
                {result.alerts?.includes("OVERWEIGHT") && (
                  <p style={{ color: "var(--red-500)" }}>
                    ⚠ This weight exceeds the maximum safe slot weight.
                  </p>
                )}
                {mode === "existing" && (
                  <button className="btn btn-primary btn-sm" onClick={applySuggestion}>
                    Apply to {selectedId}
                  </button>
                )}
              </>
            ) : (
              result.reasoning
            )}
          </div>
        )}
      </div>
    </>
  );
}
