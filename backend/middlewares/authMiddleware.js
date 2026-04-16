const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecreto_mitutoria_dev";

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(403).json({ error: "No se proveyó un token" });

  const token = authHeader.split(" ")[1]; // Formato "Bearer <token>"
  if (!token)
    return res.status(403).json({ error: "Token con formato inválido" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.rol;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};

const verifyRole = (role) => {
  return (req, res, next) => {
    if (req.userRole !== role) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para esta acción" });
    }
    next();
  };
};

module.exports = {
  authenticate: verifyToken,
  verifyToken,
  verifyRole,
  JWT_SECRET,
};
