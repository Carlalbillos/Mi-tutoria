const pool = require("../config/db");

// Obtener todos los comentarios de una tutoría
const getComments = async (req, res) => {
  try {
    const { id_tutoria } = req.params;
    const userId = req.userId;

    // Verificar que el usuario (alumno o profesor) pertenece a esta tutoría
    const [tutoria] = await pool.query(
      "SELECT id_tutoria FROM Tutorias WHERE id_tutoria = ? AND (id_alumno = ? OR id_profesor = ?)",
      [id_tutoria, userId, userId],
    );
    if (tutoria.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a esta tutoría" });
    }

    const [comments] = await pool.query(
      `
            SELECT c.id_comentario, c.texto, c.fecha_creacion, u.nombre AS autor
            FROM Comentarios_Tutoria c
            JOIN Usuarios u ON c.id_autor = u.id_usuario
            WHERE c.id_tutoria = ?
            ORDER BY c.fecha_creacion ASC
        `,
      [id_tutoria],
    );

    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo comentarios" });
  }
};

// Añadir un comentario a una tutoría
const addComment = async (req, res) => {
  try {
    const { id_tutoria } = req.params;
    const userId = req.userId;
    const { texto } = req.body;

    if (!texto || texto.trim() === "") {
      return res
        .status(400)
        .json({ error: "El comentario no puede estar vacío" });
    }

    // Verificar acceso
    const [tutoria] = await pool.query(
      "SELECT id_tutoria FROM Tutorias WHERE id_tutoria = ? AND (id_alumno = ? OR id_profesor = ?)",
      [id_tutoria, userId, userId],
    );
    if (tutoria.length === 0) {
      return res.status(403).json({ error: "No tienes acceso a esta tutoría" });
    }

    const [result] = await pool.query(
      "INSERT INTO Comentarios_Tutoria (id_tutoria, id_autor, texto) VALUES (?, ?, ?)",
      [id_tutoria, userId, texto.trim()],
    );

    res
      .status(201)
      .json({ message: "Comentario añadido", id_comentario: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error añadiendo comentario" });
  }
};

module.exports = { getComments, addComment };
