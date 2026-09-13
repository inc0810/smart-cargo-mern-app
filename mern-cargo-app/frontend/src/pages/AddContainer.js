import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createContainer } from "../api/api";

export default function AddContainer() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    containerId: "",
    size: "20ft",
    weight: "",
    type: "Dry",
    destination: "",
    unloadingPriority: 1,
    notes: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const id = form.containerId.trim().toUpperCase();
    if (!id) return;
    setSubmitting(true);
    try {
      await createContainer({
        containerId: id,
        size: form.size,
        weight: Number(form.weight) || 0,
        type: form.type,
        destination: form.destination.trim(),
        unloadingPriority: Number(form.unloadingPriority) || 1,
        notes: form.notes.trim(),
      });
      navigate(`/containers/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register container.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="page-title">Register Cargo</h1>
      <p className="page-subtitle">Add a new container's details to the system.</p>
      {error && <div className="alert-banner alert-danger">{error}</div>}
      <form className="card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-field">
            <label>Container ID *</label>
            <input
              placeholder="e.g. MSCU1234567"
              value={form.containerId}
              onChange={(e) => update("containerId", e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label>Size *</label>
            <select value={form.size} onChange={(e) => update("size", e.target.value)}>
              <option value="20ft">20 ft</option>
              <option value="40ft">40 ft</option>
              <option value="45ft">45 ft</option>
            </select>
          </div>
          <div className="form-field">
            <label>Weight (kg) *</label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 18500"
              value={form.weight}
              onChange={(e) => update("weight", e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label>Type</label>
            <select value={form.type} onChange={(e) => update("type", e.target.value)}>
              <option>Dry</option>
              <option>Reefer</option>
              <option>Hazardous</option>
              <option>Liquid</option>
              <option value="OpenTop">Open Top</option>
            </select>
          </div>
          <div className="form-field">
            <label>Destination Port *</label>
            <input
              placeholder="e.g. Rotterdam"
              value={form.destination}
              onChange={(e) => update("destination", e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label>Unloading Priority</label>
            <input
              type="number"
              min="1"
              value={form.unloadingPriority}
              onChange={(e) => update("unloadingPriority", e.target.value)}
            />
            <span className="muted" style={{ fontSize: 11 }}>
              1 = unloaded at first port of call
            </span>
          </div>
          <div className="form-field" style={{ gridColumn: "1/-1" }}>
            <label>Notes</label>
            <textarea
              rows={3}
              placeholder="Handling instructions, remarks..."
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Registering..." : "Register Container"}
          </button>
        </div>
      </form>
    </>
  );
}
