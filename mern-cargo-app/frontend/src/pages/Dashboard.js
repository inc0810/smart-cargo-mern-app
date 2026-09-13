import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSummary, getAlerts, getContainers } from "../api/api";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [summaryRes, alertsRes, containersRes] = await Promise.all([
          getSummary(),
          getAlerts(),
          getContainers(),
        ]);
        setSummary(summaryRes.data);
        setAlerts(alertsRes.data);
        setRecent(
          [...containersRes.data]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 6)
        );
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="muted">Loading dashboard...</p>;
  if (error) return <div className="alert-banner alert-danger">{error}</div>;

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Overview of cargo currently registered for this voyage.</p>

      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        <div className="card stat-card">
          <span className="stat-label">Total Containers</span>
          <span className="stat-value">{summary.totalContainers}</span>
          <span className="stat-sub">across {summary.shipCapacity} ship slots</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Total Cargo Weight</span>
          <span className="stat-value">{(summary.totalWeightKg / 1000).toFixed(1)} t</span>
          <span className="stat-sub">{summary.totalWeightKg.toLocaleString()} kg</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Slots Occupied</span>
          <span className="stat-value">
            {summary.occupiedSlots}/{summary.shipCapacity}
          </span>
          <span className="stat-sub">{summary.freeSlots} free</span>
        </div>
        <div className="card stat-card">
          <span
            className="stat-label"
            style={{ color: alerts.length ? "#b45309" : undefined }}
          >
            Active Alerts
          </span>
          <span className="stat-value" style={{ color: alerts.length ? "#b45309" : "#2b8a3e" }}>
            {alerts.length}
          </span>
          <span className="stat-sub">
            {summary.overweightCount} overweight · {summary.placementIssueCount} placement
          </span>
        </div>
      </div>

      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: 14 }}>⚠ Alerts</h3>
          {alerts.length === 0 ? (
            <p className="muted">No active alerts. Everything looks good.</p>
          ) : (
            alerts.map((c) => (
              <div
                key={c.containerId}
                className={`alert-banner ${c.isOverweight ? "alert-danger" : "alert-warn"}`}
              >
                <div>
                  <strong>{c.containerId}</strong> —{" "}
                  {c.isOverweight ? "Overweight cargo. " : ""}
                  {c.hasPlacementIssue ? c.placementNote : ""}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: 14 }}>Recently Registered</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Destination</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((c) => (
                <tr key={c.containerId}>
                  <td>
                    <Link className="link-plain" to={`/containers/${c.containerId}`}>
                      {c.containerId}
                    </Link>
                  </td>
                  <td>{c.destination}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
