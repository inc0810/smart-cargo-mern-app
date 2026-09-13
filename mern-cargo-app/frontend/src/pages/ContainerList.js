import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getContainers, deleteContainer } from "../api/api";
import StatusBadge from "../components/StatusBadge";

export default function ContainerList() {
  const [containers, setContainers] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (type) params.type = type;
      const res = await getContainers(params);
      setContainers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load containers.");
    } finally {
      setLoading(false);
    }
  }, [search, status, type]);

  useEffect(() => {
    const timeout = setTimeout(load, 250); // light debounce for the search box
    return () => clearTimeout(timeout);
  }, [load]);

  async function handleDelete(id) {
    if (!window.confirm(`Delete container ${id}?`)) return;
    try {
      await deleteContainer(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete container.");
    }
  }

  return (
    <>
      <h1 className="page-title">Containers</h1>
      <p className="page-subtitle">Search and manage all registered cargo containers.</p>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search by container ID, destination, or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option>Registered</option>
          <option>Loaded</option>
          <option>InTransit</option>
          <option>Unloaded</option>
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          <option>Dry</option>
          <option>Reefer</option>
          <option>Hazardous</option>
          <option>Liquid</option>
          <option value="OpenTop">OpenTop</option>
        </select>
        <button className="btn btn-primary" onClick={() => navigate("/add")}>
          + Register Cargo
        </button>
      </div>

      <div className="card">
        {error && <div className="alert-banner alert-danger">{error}</div>}
        {loading ? (
          <p className="muted">Loading...</p>
        ) : containers.length === 0 ? (
          <div className="empty-state">No containers match your search.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Container ID</th>
                <th>Size</th>
                <th>Weight</th>
                <th>Type</th>
                <th>Destination</th>
                <th>Position</th>
                <th>Status</th>
                <th>Flags</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {containers.map((c) => (
                <tr key={c.containerId}>
                  <td>
                    <Link className="link-plain mono" to={`/containers/${c.containerId}`}>
                      {c.containerId}
                    </Link>
                  </td>
                  <td>{c.size}</td>
                  <td>{c.weight.toLocaleString()} kg</td>
                  <td>
                    <span className="badge badge-type">{c.type}</span>
                  </td>
                  <td>{c.destination}</td>
                  <td className="mono">
                    {c.position?.bay ? (
                      `B${c.position.bay}/R${c.position.row}/T${c.position.tier}`
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td>
                    {c.isOverweight && (
                      <span className="badge badge-danger" style={{ marginRight: 4 }}>
                        Overweight
                      </span>
                    )}
                    {c.hasPlacementIssue && <span className="badge badge-warn">Placement</span>}
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.containerId)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
