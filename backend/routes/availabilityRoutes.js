const express = require("express");
const router = express.Router();
const availabilityController = require("../controllers/availabilityController");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");

router.get(
  "/teacher/:teacherId",
  verifyToken,
  availabilityController.getTeacherAvailability,
);
router.post(
  "/",
  verifyToken,
  verifyRole("profesor"),
  availabilityController.addAvailability,
);
router.delete(
  "/:id",
  verifyToken,
  verifyRole("profesor"),
  availabilityController.deleteAvailability,
);

module.exports = router;
