const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecreto_mitutoria_dev";

const register = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { nombre, email, password, nombre_rol, id_curso, id_departamento } =
      req.body;

    if (!nombre || !email || !password || !nombre_rol) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    await connection.beginTransaction();

    // 1. Obtener ID del Rol
    const [roles] = await connection.query(
      "SELECT id_rol FROM Roles WHERE nombre_rol = ?",
      [nombre_rol],
    );
    if (roles.length === 0) throw new Error("Rol no válido");
    const id_rol = roles[0].id_rol;

    // 2. Crear Usuario Base
    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await connection.query(
      "INSERT INTO Usuarios (nombre, email, password, id_rol) VALUES (?, ?, ?, ?)",
      [nombre, email, hashedPassword, id_rol],
    );
    const userId = userResult.insertId;

    // 3. Crear en Tabla Específica
    if (nombre_rol === "alumno") {
      if (!id_curso) throw new Error("El alumno debe tener un curso");
      await connection.query(
        "INSERT INTO Alumnos (id_usuario, id_curso) VALUES (?, ?)",
        [userId, id_curso],
      );
    } else if (nombre_rol === "profesor") {
      if (!id_departamento)
        throw new Error("El profesor debe tener un departamento");
      await connection.query(
        "INSERT INTO Profesores (id_usuario, id_departamento) VALUES (?, ?)",
        [userId, id_departamento],
      );
    }

    await connection.commit();
    res
      .status(201)
      .json({ message: "Usuario registrado exitosamente", id: userId });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: error.message || "Error en el registro" });
  } finally {
    connection.release();
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query(
      `
            SELECT u.*, r.nombre_rol as rol, 
                   a.id_curso, c.nombre as curso_nombre,
                   p.id_departamento, d.nombre as departamento_nombre
            FROM Usuarios u
            JOIN Roles r ON u.id_rol = r.id_rol
            LEFT JOIN Alumnos a ON u.id_usuario = a.id_usuario
            LEFT JOIN Cursos c ON a.id_curso = c.id_curso
            LEFT JOIN Profesores p ON u.id_usuario = p.id_usuario
            LEFT JOIN Departamentos d ON p.id_departamento = d.id_departamento
            WHERE u.email = ?
        `,
      [email],
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign({ id: user.id_usuario, rol: user.rol }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      token,
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        curso: user.curso_nombre,
        departamento: user.departamento_nombre,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

module.exports = { register, login };
