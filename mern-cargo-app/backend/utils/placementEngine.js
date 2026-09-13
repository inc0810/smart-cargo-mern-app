/**
 * Smart Cargo Management System
 * -------------------------------
 * Rule-based "AI" placement engine.
 *
 * This is a deterministic heuristic (not a trained ML model) that scores
 * every free slot on the ship and picks the best one for a container,
 * based on:
 *   - Weight (heavy containers go low, for ship stability)
 *   - Unloading order (containers unloaded first go high/accessible)
 *   - Container type (Hazardous / Reefer get dedicated zones)
 *   - Left-right (row) and fore-aft (bay) weight balance
 *
 * It is intentionally written as a standalone, swappable module so it can
 * later be replaced with a real ML model (e.g. a trained scikit-learn /
 * TensorFlow service) without touching the rest of the app.
 */

const SHIP_CONFIG = {
  bays: 6, // 1 (bow/front) -> 6 (stern/back)
  rows: 4, // 1 (port/left) -> 4 (starboard/right)
  tiers: 3, // 1 (bottom, below deck) -> 3 (top, above deck)
  maxSlotWeightKg: 30000, // max safe weight for any single slot/container
  reeferBay: 1, // bay with power hook-ups for reefer containers
  hazardousBay: 6, // bay furthest from crew quarters / engine room
};

function allSlots() {
  const slots = [];
  for (let bay = 1; bay <= SHIP_CONFIG.bays; bay++) {
    for (let row = 1; row <= SHIP_CONFIG.rows; row++) {
      for (let tier = 1; tier <= SHIP_CONFIG.tiers; tier++) {
        slots.push({ bay, row, tier });
      }
    }
  }
  return slots;
}

function slotKey(pos) {
  return `${pos.bay}-${pos.row}-${pos.tier}`;
}

function bayWeightTotals(existingContainers) {
  const totals = {};
  for (let bay = 1; bay <= SHIP_CONFIG.bays; bay++) totals[bay] = 0;
  existingContainers.forEach((c) => {
    if (c.position && c.position.bay) {
      totals[c.position.bay] = (totals[c.position.bay] || 0) + (c.weight || 0);
    }
  });
  return totals;
}

function rowWeightTotals(existingContainers) {
  const totals = {};
  for (let row = 1; row <= SHIP_CONFIG.rows; row++) totals[row] = 0;
  existingContainers.forEach((c) => {
    if (c.position && c.position.row) {
      totals[c.position.row] = (totals[c.position.row] || 0) + (c.weight || 0);
    }
  });
  return totals;
}

/**
 * Score a candidate slot for a given container. Lower score = better.
 */
function scoreSlot(slot, container, occupied, bayTotals, rowTotals) {
  let score = 0;

  // 1. Stability: heavier containers should sit in lower tiers.
  //    Ideal tier scales inversely with weight.
  const idealTier = Math.max(
    1,
    Math.min(SHIP_CONFIG.tiers, SHIP_CONFIG.tiers - Math.floor(container.weight / 10000))
  );
  score += Math.abs(slot.tier - idealTier) * 15;

  // 2. Unloading order: containers unloaded earlier (lower priority number)
  //    should be higher/more accessible (top tiers), so they aren't buried
  //    under cargo that stays aboard longer.
  const accessibilityBonus = (SHIP_CONFIG.tiers - slot.tier) * (1 / container.unloadingPriority);
  score -= accessibilityBonus * 5;

  // 3. Type-specific zoning.
  if (container.type === "Reefer") {
    score += Math.abs(slot.bay - SHIP_CONFIG.reeferBay) * 20; // must stay near power
  }
  if (container.type === "Hazardous") {
    score += Math.abs(slot.bay - SHIP_CONFIG.hazardousBay) * 20; // isolate from crew
    score += slot.tier === SHIP_CONFIG.tiers ? 0 : 10; // prefer top tier, easy jettison/access
  }

  // 4. Fore-aft (bay) balance: discourage piling too much weight in one bay.
  score += (bayTotals[slot.bay] || 0) / 1000;

  // 5. Port-starboard (row) balance.
  score += (rowTotals[slot.row] || 0) / 1000;

  // 6. Slot already occupied -> heavily penalize (should be filtered out anyway).
  if (occupied.has(slotKey(slot))) score += 1e9;

  return score;
}

/**
 * Suggest the best free slot + explanation for a container.
 * @param {Object} container - { weight, type, unloadingPriority, size }
 * @param {Array}  existingContainers - containers already placed (with .position, .weight, .type)
 * @param {String} excludeContainerId - optional, ignore this container's own current slot (for re-placement)
 */
function suggestPlacement(container, existingContainers = [], excludeContainerId = null) {
  const occupied = new Set();
  existingContainers.forEach((c) => {
    if (
      c.position &&
      c.position.bay &&
      c.position.row &&
      c.position.tier &&
      c.containerId !== excludeContainerId
    ) {
      occupied.add(slotKey(c.position));
    }
  });

  const bayTotals = bayWeightTotals(
    existingContainers.filter((c) => c.containerId !== excludeContainerId)
  );
  const rowTotals = rowWeightTotals(
    existingContainers.filter((c) => c.containerId !== excludeContainerId)
  );

  const candidates = allSlots().filter((s) => !occupied.has(slotKey(s)));

  if (candidates.length === 0) {
    return {
      position: null,
      reasoning: "Ship is at full capacity. No free slots available.",
      alerts: ["SHIP_FULL"],
    };
  }

  let best = null;
  let bestScore = Infinity;
  candidates.forEach((slot) => {
    const s = scoreSlot(slot, container, occupied, bayTotals, rowTotals);
    if (s < bestScore) {
      bestScore = s;
      best = slot;
    }
  });

  const reasoningParts = [];
  if (container.weight > 20000) {
    reasoningParts.push("heavy container placed in a low tier for ship stability");
  } else if (container.weight < 8000) {
    reasoningParts.push("lighter container placed higher, above heavier cargo");
  }
  if (container.unloadingPriority <= 2) {
    reasoningParts.push("early unloading priority, so placed for easy/quick access");
  }
  if (container.type === "Reefer") {
    reasoningParts.push("assigned near the reefer power bay");
  }
  if (container.type === "Hazardous") {
    reasoningParts.push("isolated in the designated hazardous-cargo bay");
  }
  reasoningParts.push("bay/row chosen to keep the ship's weight balanced fore-aft and port-starboard");

  const alerts = [];
  if (container.weight > SHIP_CONFIG.maxSlotWeightKg) {
    alerts.push("OVERWEIGHT");
  }

  return {
    position: best,
    reasoning: `Suggested Bay ${best.bay}, Row ${best.row}, Tier ${best.tier} — ${reasoningParts.join(", ")}.`,
    alerts,
  };
}

/**
 * Validate an existing/manual placement and flag issues:
 * heavier container stacked above a lighter one, hazardous/reefer misplacement, overweight slot.
 */
function validatePlacement(container, existingContainers = []) {
  const issues = [];

  if (container.weight > SHIP_CONFIG.maxSlotWeightKg) {
    issues.push(`Overweight: ${container.weight}kg exceeds max slot limit of ${SHIP_CONFIG.maxSlotWeightKg}kg.`);
  }

  if (container.position && container.position.bay) {
    const { bay, row, tier } = container.position;

    // Check the container directly below (tier - 1) in the same bay/row.
    const below = existingContainers.find(
      (c) =>
        c.containerId !== container.containerId &&
        c.position &&
        c.position.bay === bay &&
        c.position.row === row &&
        c.position.tier === tier - 1
    );
    if (below && below.weight < container.weight) {
      issues.push(
        `Incorrect stacking: this container (${container.weight}kg) is heavier than the one below it at Tier ${tier - 1} (${below.weight}kg).`
      );
    }

    if (container.type === "Hazardous" && bay !== SHIP_CONFIG.hazardousBay) {
      issues.push(`Hazardous cargo should be in Bay ${SHIP_CONFIG.hazardousBay}, not Bay ${bay}.`);
    }
    if (container.type === "Reefer" && bay !== SHIP_CONFIG.reeferBay) {
      issues.push(`Reefer cargo should be near Bay ${SHIP_CONFIG.reeferBay} for power access.`);
    }
  }

  return issues;
}

module.exports = {
  SHIP_CONFIG,
  suggestPlacement,
  validatePlacement,
};
