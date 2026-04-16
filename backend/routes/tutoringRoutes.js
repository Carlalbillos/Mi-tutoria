const express = require("express");
const router = express.Router();
const tutoringController = require("../controllers/tutoringController");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");

router.post(
  "/",
  verifyToken,
  verifyRole("alumno"),
  tutoringController.bookTutoring,
);
router.get("/", verifyToken, tutoringController.getMyTutorings);
router.patch(
  "/:id/status",
  verifyToken,
  tutoringController.updateTutoringStatus,
);

module.exports = router;
