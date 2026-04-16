const pool = require("../config/db");

const getProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const [users] = await pool.query(
      `
            SELECT u.id_usuario, u.nombre, u.email, r.nombre_rol 
            FROM Usuarios u 
            JOIN Roles r ON u.id_rol = r.id_rol 
            WHERE u.id_usuario = ?
        `,
      [userId],
    );

    if (users.length === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });

    res.json(users[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getTeachers = async (req, res) => {
  try {
    const [teachers] = await pool.query(`
            SELECT u.id_usuario, u.nombre, u.email 
            FROM Usuarios u 
            JOIN Roles r ON u.id_rol = r.id_rol 
            WHERE r.nombre_rol = 'profesor'
        `);
    res.json(teachers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo lista de profesores" });
  }
};

module.exports = { getProfile, getTeachers };
