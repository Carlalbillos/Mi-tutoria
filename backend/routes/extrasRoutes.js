const express = require("express");
const router = express.Router();
const extrasController = require("../controllers/extrasController");

router.get("/cursos", extrasController.getCursos);
router.get("/asignaturas", extrasController.getAsignaturas);
router.get("/departamentos", extrasController.getDepartamentos);

module.exports = router;
