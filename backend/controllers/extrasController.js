const pool = require("../config/db");

const getCursos = async (req, res) => {
  try {
    const [cursos] = await pool.query(
      "SELECT id_curso, nombre, turno FROM Cursos ORDER BY id_curso",
    );
    res.json(cursos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo cursos" });
  }
};

const getAsignaturas = async (req, res) => {
  try {
    const [asignaturas] = await pool.query(
      "SELECT id_asignatura, nombre FROM Asignaturas ORDER BY nombre",
    );
    res.json(asignaturas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo asignaturas" });
  }
};

const getDepartamentos = async (req, res) => {
  try {
    const [depts] = await pool.query(
      "SELECT id_departamento, nombre FROM Departamentos ORDER BY nombre",
    );
    res.json(depts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo departamentos" });
  }
};

module.exports = { getCursos, getAsignaturas, getDepartamentos };
