const pool = require("../config/db");

// Obtener disponibilidad de un profesor
const getTeacherAvailability = async (req, res) => {
  try {
    const { teacherId } = req.params;
    let query = "SELECT * FROM Disponibilidad";
    let params = [];

    if (teacherId) {
      query += " WHERE id_profesor = ?";
      params.push(teacherId);
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo disponibilidad" });
  }
};

// Añadir disponibilidad (Solo Profesores)
const addAvailability = async (req, res) => {
  try {
    const id_profesor = req.userId;
    const { fecha, hora_inicio, hora_fin } = req.body;

    if (!fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // 1. Verificar que el profesor existe en la tabla Profesores (Doble seguridad)
    const [prof] = await pool.query(
      "SELECT id_usuario FROM Profesores WHERE id_usuario = ?",
      [id_profesor],
    );
    if (prof.length === 0) {
      return res
        .status(403)
        .json({ error: "Solo los profesores pueden añadir disponibilidad" });
    }

    const [result] = await pool.query(
      "INSERT INTO Disponibilidad (id_profesor, fecha, hora_inicio, hora_fin) VALUES (?, ?, ?, ?)",
      [id_profesor, fecha, hora_inicio, hora_fin],
    );

    res
      .status(201)
      .json({
        message: "Bloque de disponibilidad añadido",
        id: result.insertId,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error añadiendo disponibilidad" });
  }
};

// Eliminar disponibilidad (Solo el dueño)
const deleteAvailability = async (req, res) => {
  try {
    const id_disponibilidad = req.params.id;
    const id_profesor = req.userId;

    await pool.query(
      "DELETE FROM Disponibilidad WHERE id_disponibilidad = ? AND id_profesor = ?",
      [id_disponibilidad, id_profesor],
    );

    res.json({ message: "Disponibilidad eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error eliminando disponibilidad" });
  }
};

// Obtener lista de todos los profesores (con sus nombres desde Usuarios)
const getAllTeachers = async (req, res) => {
  try {
    const [teachers] = await pool.query(`
            SELECT p.id_usuario, u.nombre, d.nombre as departamento
            FROM Profesores p
            JOIN Usuarios u ON p.id_usuario = u.id_usuario
            JOIN Departamentos d ON p.id_departamento = d.id_departamento
            ORDER BY u.nombre
        `);
    res.json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo profesores" });
  }
};

module.exports = {
  getTeacherAvailability,
  addAvailability,
  deleteAvailability,
  getAllTeachers,
};
