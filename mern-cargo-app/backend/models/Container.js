const mongoose = require("mongoose");

const positionSchema = new mongoose.Schema(
  {
    bay: { type: Number, default: null },   // 1..SHIP_CONFIG.bays  (fore -> aft)
    row: { type: Number, default: null },   // 1..SHIP_CONFIG.rows  (port -> starboard)
    tier: { type: Number, default: null },  // 1..SHIP_CONFIG.tiers (1 = bottom/deepest)
  },
  { _id: false }
);

const containerSchema = new mongoose.Schema(
  {
    containerId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    size: {
      type: String,
      enum: ["20ft", "40ft", "45ft"],
      required: true,
    },
    weight: {
      // in kilograms
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ["Dry", "Reefer", "Hazardous", "Liquid", "OpenTop"],
      default: "Dry",
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    unloadingPriority: {
      // Lower number = unloaded earlier (first port of call)
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ["Registered", "Loaded", "InTransit", "Unloaded"],
      default: "Registered",
    },
    position: {
      type: positionSchema,
      default: () => ({}),
    },
    isOverweight: {
      type: Boolean,
      default: false,
    },
    hasPlacementIssue: {
      type: Boolean,
      default: false,
    },
    placementNote: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Container", containerSchema);
