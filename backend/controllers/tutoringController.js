const pool = require("../config/db");
const { createNotification } = require("./notificationController");

// Reservar (Alumno)
const bookTutoring = async (req, res) => {
  try {
    const studentId = req.userId;
    const { id_profesor, id_asignatura, fecha, hora_inicio, hora_fin, motivo } =
      req.body;

    if (!id_profesor || !fecha || !hora_inicio || !hora_fin) {
      return res.status(400).json({ error: "Faltan parámetros requeridos" });
    }

    // Comprobar si el profesor ya tiene tutoría en ese horario
    const [existing] = await pool.query(
      `
            SELECT id_tutoria FROM Tutorias 
            WHERE id_profesor = ? AND fecha = ? AND hora_inicio = ? AND estado != 'cancelada'
        `,
      [id_profesor, fecha, hora_inicio],
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: "El profesor ya tiene una tutoría reservada en ese horario",
      });
    }

    const [result] = await pool.query(
      `
            INSERT INTO Tutorias (id_profesor, id_alumno, id_asignatura, fecha, hora_inicio, hora_fin, estado, motivo) 
            VALUES (?, ?, ?, ?, ?, ?, 'reservada', ?)
        `,
      [
        id_profesor,
        studentId,
        id_asignatura || null,
        fecha,
        hora_inicio,
        hora_fin,
        motivo || "",
      ],
    );

    // Notificar al profesor
    const [[alumno]] = await pool.query(
      "SELECT nombre FROM Usuarios WHERE id_usuario = ?",
      [studentId],
    );
    const fechaStr = new Date(fecha).toLocaleDateString("es-ES");
    await createNotification(
      pool,
      id_profesor,
      `📅 ${alumno.nombre} ha reservado una tutoría el ${fechaStr} a las ${hora_inicio.slice(0, 5)}.`,
    );

    res
      .status(201)
      .json({ message: "Tutoría reservada", id_tutoria: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error reservando tutoría" });
  }
};

// Historial (Profesor o Alumno ven las suyas)
const getMyTutorings = async (req, res) => {
  try {
    const userId = req.userId;
    const role = req.userRole;

    const joinRoleField = role === "profesor" ? "id_alumno" : "id_profesor";
    const roleField = role === "profesor" ? "id_profesor" : "id_alumno";

    const [tutorings] = await pool.query(
      `
            SELECT t.*, u.nombre as contraparte_nombre, u.email as contraparte_email, a.nombre as asignatura_nombre
            FROM Tutorias t
            JOIN Usuarios u ON t.${joinRoleField} = u.id_usuario
            LEFT JOIN Asignaturas a ON t.id_asignatura = a.id_asignatura
            WHERE t.${roleField} = ?
            ORDER BY t.fecha, t.hora_inicio
        `,
      [userId],
    );

    res.json(tutorings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo tutorías" });
  }
};

// Actualizar estado (Cancelar/Completar)
const updateTutoringStatus = async (req, res) => {
  try {
    const id_tutoria = req.params.id;
    const { estado } = req.body;
    const userId = req.userId;
    const role = req.userRole;

    if (!["cancelada", "completada"].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const roleField = role === "profesor" ? "id_profesor" : "id_alumno";

    const [[tutoria]] = await pool.query(
      `
            SELECT t.*, u.nombre AS nombre_usuario
            FROM Tutorias t
            JOIN Usuarios u ON u.id_usuario = ?
            WHERE t.id_tutoria = ? AND t.${roleField} = ?
        `,
      [userId, id_tutoria, userId],
    );

    if (!tutoria) {
      return res.status(404).json({ error: "Tutoría no encontrada" });
    }

    await pool.query("UPDATE Tutorias SET estado = ? WHERE id_tutoria = ?", [
      estado,
      id_tutoria,
    ]);

    const contraparte =
      role === "profesor" ? tutoria.id_alumno : tutoria.id_profesor;
    const fechaStr = new Date(tutoria.fecha).toLocaleDateString("es-ES");
    await createNotification(
      pool,
      contraparte,
      `${estado === "cancelada" ? "❌" : "✅"} ${tutoria.nombre_usuario} ha ${estado === "cancelada" ? "cancelado" : "completado"} la tutoría del ${fechaStr}.`,
    );

    res.json({ message: `Estado actualizado a ${estado}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error actualizando tutoría" });
  }
};

module.exports = { bookTutoring, getMyTutorings, updateTutoringStatus };
