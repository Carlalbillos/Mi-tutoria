const pool = require("../config/db");

// Obtener notificaciones no leídas del usuario autenticado
const getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const [notifs] = await pool.query(
      `
            SELECT id_notificacion, mensaje, leida, fecha_creacion
            FROM Notificaciones
            WHERE id_usuario = ?
            ORDER BY fecha_creacion DESC
            LIMIT 20
        `,
      [userId],
    );
    res.json(notifs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo notificaciones" });
  }
};

// Marcar una notificación como leída
const markAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    await pool.query(
      "UPDATE Notificaciones SET leida = TRUE WHERE id_notificacion = ? AND id_usuario = ?",
      [id, userId],
    );
    res.json({ message: "Notificación marcada como leída" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error actualizando notificación" });
  }
};

// Marcar TODAS como leídas
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    await pool.query(
      "UPDATE Notificaciones SET leida = TRUE WHERE id_usuario = ?",
      [userId],
    );
    res.json({ message: "Todas las notificaciones marcadas como leídas" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error actualizando notificaciones" });
  }
};

// Función interna para crear una notificación (usada por otros controladores)
const createNotification = async (pool, id_usuario, mensaje) => {
  await pool.query(
    "INSERT INTO Notificaciones (id_usuario, mensaje) VALUES (?, ?)",
    [id_usuario, mensaje],
  );
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
};
