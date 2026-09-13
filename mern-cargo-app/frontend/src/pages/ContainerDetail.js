import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getContainer,
  updateContainer,
  deleteContainer,
  placeContainer,
  suggestPlacement,
} from "../api/api";
import StatusBadge from "../components/StatusBadge";

const STATUSES = ["Registered", "Loaded", "InTransit", "Unloaded"];

export default function ContainerDetail() {
  const { containerId } = useParams();
  const navigate = useNavigate();
  const [container, setContainer] = useState(null);
  const [error, setError] = useState("");
  const [suggestion, setSuggestion] = useState(null);
  const [manual, setManual] = useState({ bay: "", row: "", tier: "" });
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await getContainer(containerId);
      setContainer(res.data);
      setManual({
        bay: res.data.position?.bay || "",
        row: res.data.position?.row || "",
        tier: res.data.position?.tier || "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Container not found.");
    }
  }, [containerId]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(status) {
    try {
      await updateContainer(containerId, { status });
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to update status.");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete container ${containerId}?`)) return;
    try {
      await deleteContainer(containerId);
      navigate("/containers");
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to delete container.");
    }
  }

  async function getSuggestion() {
    setActionError("");
    try {
      const res = await suggestPlacement({ containerId });
      setSuggestion(res.data);
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to get AI suggestion.");
    }
  }

  async function applySuggestion() {
    if (!suggestion?.position) return;
    try {
      await placeContainer(containerId, suggestion.position);
      setSuggestion(null);
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to apply placement.");
    }
  }

  async function handleManualPlace(e) {
    e.preventDefault();
    setActionError("");
    try {
      await placeContainer(containerId, {
        bay: Number(manual.bay),
        row: Number(manual.row),
        tier: Number(manual.tier),
      });
      load();
    } catch (err) {
      setActionError(err.response?.data?.message || "Failed to set position.");
    }
  }

  if (error) {
    return (
      <>
        <div className="alert-banner alert-danger">{error}</div>
        <Link className="link-plain" to="/containers">
          &larr; Back to containers
        </Link>
      </>
    );
  }

  if (!container) return <p className="muted">Loading...</p>;

  const c = container;

  return (
    <>
      <Link className="link-plain" to="/containers">
        &larr; Back to containers
      </Link>
      <h1 className="page-title" style={{ marginTop: 10 }}>
        {c.containerId}
      </h1>
      <p className="page-subtitle">Registered {new Date(c.createdAt).toLocaleString()}</p>

      {(c.isOverweight || c.hasPlacementIssue || actionError) && (
        <div>
          {actionError && <div className="alert-banner alert-danger">{actionError}</div>}
          {c.isOverweight && (
            <div className="alert-banner alert-danger">
              ⚠ This container exceeds the maximum safe slot weight.
            </div>
          )}
          {c.hasPlacementIssue && (
            <div className="alert-banner alert-warn">⚠ {c.placementNote}</div>
          )}
        </div>
      )}

      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: 14 }}>Details</h3>
          <table>
            <tbody>
              <tr>
                <td className="muted">Size</td>
                <td>{c.size}</td>
              </tr>
              <tr>
                <td className="muted">Weight</td>
                <td>{c.weight.toLocaleString()} kg</td>
              </tr>
              <tr>
                <td className="muted">Type</td>
                <td>
                  <span className="badge badge-type">{c.type}</span>
                </td>
              </tr>
              <tr>
                <td className="muted">Destination</td>
                <td>{c.destination}</td>
              </tr>
              <tr>
                <td className="muted">Unloading Priority</td>
                <td>{c.unloadingPriority}</td>
              </tr>
              <tr>
                <td className="muted">Status</td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
              </tr>
              <tr>
                <td className="muted">Position</td>
                <td className="mono">
                  {c.position?.bay
                    ? `Bay ${c.position.bay} / Row ${c.position.row} / Tier ${c.position.tier}`
                    : "Not yet placed"}
                </td>
              </tr>
              <tr>
                <td className="muted">Notes</td>
                <td>{c.notes || "—"}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STATUSES.map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${c.status === s ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>
              Delete Container
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: 14 }}>Placement</h3>
          <p className="muted" style={{ marginTop: -4 }}>
            Get an AI-suggested slot, or set the position manually.
          </p>
          <button className="btn btn-secondary" onClick={getSuggestion}>
            ✨ Get AI Suggestion
          </button>
          {suggestion && (
            <div className="reasoning-box">
              {suggestion.position ? (
                <>
                  <strong>
                    Suggested: Bay {suggestion.position.bay}, Row {suggestion.position.row}, Tier{" "}
                    {suggestion.position.tier}
                  </strong>
                  <p style={{ margin: "6px 0" }}>{suggestion.reasoning}</p>
                  {suggestion.alerts?.includes("OVERWEIGHT") && (
                    <p style={{ color: "var(--red-500)" }}>
                      ⚠ This weight exceeds the maximum safe slot weight.
                    </p>
                  )}
                  <button className="btn btn-primary btn-sm" onClick={applySuggestion}>
                    Apply This Placement
                  </button>
                </>
              ) : (
                suggestion.reasoning
              )}
            </div>
          )}
          <form className="form-grid" style={{ marginTop: 14 }} onSubmit={handleManualPlace}>
            <div className="form-field">
              <label>Bay (1-6)</label>
              <input
                type="number"
                min="1"
                max="6"
                value={manual.bay}
                onChange={(e) => setManual((m) => ({ ...m, bay: e.target.value }))}
                required
              />
            </div>
            <div className="form-field">
              <label>Row (1-4)</label>
              <input
                type="number"
                min="1"
                max="4"
                value={manual.row}
                onChange={(e) => setManual((m) => ({ ...m, row: e.target.value }))}
                required
              />
            </div>
            <div className="form-field">
              <label>Tier (1-3)</label>
              <input
                type="number"
                min="1"
                max="3"
                value={manual.tier}
                onChange={(e) => setManual((m) => ({ ...m, tier: e.target.value }))}
                required
              />
            </div>
            <div className="form-field" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-primary" type="submit">
                Set Position
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
