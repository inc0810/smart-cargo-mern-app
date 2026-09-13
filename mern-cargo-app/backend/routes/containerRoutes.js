const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/containerController");

// Specific routes first (avoid clashing with /:containerId)
router.get("/report/summary", ctrl.getSummary);
router.get("/alerts", ctrl.getAlerts);
router.post("/suggest-placement", ctrl.suggestPlacementForContainer);

router.route("/").get(ctrl.getContainers).post(ctrl.createContainer);

router
  .route("/:containerId")
  .get(ctrl.getContainerById)
  .put(ctrl.updateContainer)
  .delete(ctrl.deleteContainer);

router.post("/:containerId/place", ctrl.placeContainer);

module.exports = router;
