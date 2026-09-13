import React, { useEffect, useState } from "react";
import { getSummary } from "../api/api";

function Breakdown({ title, obj }) {
  const entries = Object.entries(obj || {});
  return (
    <div className="card">
      <h3 style={{ marginTop: 0, fontSize: 14 }}>{title}</h3>
      {entries.length === 0 ? (
        <p className="muted">No data.</p>
      ) : (
        <table>
          <tbody>
            {entries.map(([k, v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td style={{ textAlign: "right", fontWeight: "bold" }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSummary()
      .then((res) => setSummary(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load report."));
  }, []);

  if (error) return <div className="alert-banner alert-danger">{error}</div>;
  if (!summary) return <p className="muted">Loading report...</p>;

  const occupancyPct = ((summary.occupiedSlots / summary.shipCapacity) * 100).toFixed(0);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Cargo Summary Report</h1>
          <p className="page-subtitle">
            Snapshot of all cargo currently in the system, generated {new Date().toLocaleString()}.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          🖨 Print / Export
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        <div className="card stat-card">
          <span className="stat-label">Total Containers</span>
          <span className="stat-value">{summary.totalContainers}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Total Weight</span>
          <span className="stat-value">{(summary.totalWeightKg / 1000).toFixed(1)} t</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Ship Occupancy</span>
          <span className="stat-value">{occupancyPct}%</span>
          <span className="stat-sub">
            {summary.occupiedSlots}/{summary.shipCapacity} slots
          </span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Overweight / Issues</span>
          <span className="stat-value">
            {summary.overweightCount} / {summary.placementIssueCount}
          </span>
        </div>
      </div>

      <div className="grid grid-3">
        <Breakdown title="By Status" obj={summary.byStatus} />
        <Breakdown title="By Type" obj={summary.byType} />
        <Breakdown title="By Destination" obj={summary.byDestination} />
      </div>
    </>
  );
}
