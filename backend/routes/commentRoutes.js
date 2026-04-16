const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleware");
const commentController = require("../controllers/commentController");

router.get("/:id_tutoria", authenticate, commentController.getComments);
router.post("/:id_tutoria", authenticate, commentController.addComment);

module.exports = router;
