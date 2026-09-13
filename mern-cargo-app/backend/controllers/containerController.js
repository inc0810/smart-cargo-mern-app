const Container = require("../models/Container");
const { suggestPlacement, validatePlacement, SHIP_CONFIG } = require("../utils/placementEngine");

// @desc Register a new container
// @route POST /api/containers
exports.createContainer = async (req, res) => {
  try {
    const { containerId, size, weight, type, destination, unloadingPriority, notes } = req.body;

    if (!containerId || !size || !weight || !destination) {
      return res.status(400).json({ message: "containerId, size, weight and destination are required." });
    }

    const exists = await Container.findOne({ containerId: containerId.toUpperCase() });
    if (exists) {
      return res.status(409).json({ message: `Container ${containerId} already exists.` });
    }

    const container = new Container({
      containerId,
      size,
      weight,
      type,
      destination,
      unloadingPriority,
      notes,
      isOverweight: weight > SHIP_CONFIG.maxSlotWeightKg,
    });

    await container.save();
    res.status(201).json(container);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get all containers (supports search + filters via query params)
// @route GET /api/containers?search=&status=&type=&destination=
exports.getContainers = async (req, res) => {
  try {
    const { search, status, type, destination } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (destination) filter.destination = new RegExp(destination, "i");

    if (search) {
      filter.$or = [
        { containerId: new RegExp(search, "i") },
        { destination: new RegExp(search, "i") },
        { type: new RegExp(search, "i") },
      ];
    }

    const containers = await Container.find(filter).sort({ createdAt: -1 });
    res.json(containers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get a single container by containerId
// @route GET /api/containers/:containerId
exports.getContainerById = async (req, res) => {
  try {
    const container = await Container.findOne({ containerId: req.params.containerId.toUpperCase() });
    if (!container) return res.status(404).json({ message: "Container not found." });
    res.json(container);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Update a container (details, status, or manual position)
// @route PUT /api/containers/:containerId
exports.updateContainer = async (req, res) => {
  try {
    const container = await Container.findOne({ containerId: req.params.containerId.toUpperCase() });
    if (!container) return res.status(404).json({ message: "Container not found." });

    const updatable = [
      "size",
      "weight",
      "type",
      "destination",
      "unloadingPriority",
      "status",
      "position",
      "notes",
    ];
    updatable.forEach((field) => {
      if (req.body[field] !== undefined) container[field] = req.body[field];
    });

    container.isOverweight = container.weight > SHIP_CONFIG.maxSlotWeightKg;

    // Re-validate placement whenever weight/type/position changes
    const others = await Container.find({ containerId: { $ne: container.containerId } });
    const issues = validatePlacement(container, others);
    container.hasPlacementIssue = issues.length > 0;
    container.placementNote = issues.join(" ");

    await container.save();
    res.json(container);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Delete a container
// @route DELETE /api/containers/:containerId
exports.deleteContainer = async (req, res) => {
  try {
    const container = await Container.findOneAndDelete({ containerId: req.params.containerId.toUpperCase() });
    if (!container) return res.status(404).json({ message: "Container not found." });
    res.json({ message: `Container ${container.containerId} deleted.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc AI-based placement suggestion for a container (existing or hypothetical)
// @route POST /api/containers/suggest-placement
// body: { containerId } to place an existing registered container
//   OR  { weight, type, unloadingPriority, size } for a hypothetical one
exports.suggestPlacementForContainer = async (req, res) => {
  try {
    let containerData = req.body;
    let excludeId = null;

    if (req.body.containerId) {
      const existing = await Container.findOne({ containerId: req.body.containerId.toUpperCase() });
      if (!existing) return res.status(404).json({ message: "Container not found." });
      containerData = existing;
      excludeId = existing.containerId;
    }

    if (containerData.unloadingPriority === undefined) containerData.unloadingPriority = 1;

    const others = await Container.find(excludeId ? { containerId: { $ne: excludeId } } : {});
    const result = suggestPlacement(containerData, others, excludeId);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Apply a suggested (or manual) placement to a container
// @route POST /api/containers/:containerId/place
// body: { bay, row, tier }
exports.placeContainer = async (req, res) => {
  try {
    const container = await Container.findOne({ containerId: req.params.containerId.toUpperCase() });
    if (!container) return res.status(404).json({ message: "Container not found." });

    const { bay, row, tier } = req.body;
    if (!bay || !row || !tier) {
      return res.status(400).json({ message: "bay, row and tier are required." });
    }

    // Prevent double-booking a slot
    const clash = await Container.findOne({
      containerId: { $ne: container.containerId },
      "position.bay": bay,
      "position.row": row,
      "position.tier": tier,
    });
    if (clash) {
      return res.status(409).json({ message: `Slot Bay ${bay}/Row ${row}/Tier ${tier} is already occupied by ${clash.containerId}.` });
    }

    container.position = { bay, row, tier };
    if (container.status === "Registered") container.status = "Loaded";

    const others = await Container.find({ containerId: { $ne: container.containerId } });
    const issues = validatePlacement(container, others);
    container.hasPlacementIssue = issues.length > 0;
    container.placementNote = issues.join(" ");

    await container.save();
    res.json(container);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Cargo summary / report
// @route GET /api/containers/report/summary
exports.getSummary = async (req, res) => {
  try {
    const containers = await Container.find();

    const totalContainers = containers.length;
    const totalWeight = containers.reduce((sum, c) => sum + (c.weight || 0), 0);
    const overweightCount = containers.filter((c) => c.isOverweight).length;
    const placementIssueCount = containers.filter((c) => c.hasPlacementIssue).length;

    const byStatus = {};
    const byType = {};
    const byDestination = {};

    containers.forEach((c) => {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      byType[c.type] = (byType[c.type] || 0) + 1;
      byDestination[c.destination] = (byDestination[c.destination] || 0) + 1;
    });

    const capacityTotal = SHIP_CONFIG.bays * SHIP_CONFIG.rows * SHIP_CONFIG.tiers;
    const occupiedSlots = containers.filter((c) => c.position && c.position.bay).length;

    res.json({
      totalContainers,
      totalWeightKg: totalWeight,
      overweightCount,
      placementIssueCount,
      byStatus,
      byType,
      byDestination,
      shipCapacity: capacityTotal,
      occupiedSlots,
      freeSlots: capacityTotal - occupiedSlots,
      shipConfig: SHIP_CONFIG,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc All active alerts (overweight / placement issues)
// @route GET /api/containers/alerts
exports.getAlerts = async (req, res) => {
  try {
    const containers = await Container.find({
      $or: [{ isOverweight: true }, { hasPlacementIssue: true }],
    });
    res.json(containers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
