SET NAMES 'utf8mb4';
SET CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS mitutoria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mitutoria;

-- 1. TABLAS MAESTRAS
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS Roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol ENUM('profesor', 'alumno') NOT NULL
);
INSERT INTO Roles (nombre_rol) VALUES ('profesor'), ('alumno');

CREATE TABLE IF NOT EXISTS Cursos (
    id_curso INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    turno ENUM('mañana', 'tarde', 'online') DEFAULT 'mañana'
);
INSERT INTO Cursos (nombre, turno) VALUES 
('1º DAW', 'mañana'), ('2º DAW', 'tarde'), ('3º ESO', 'mañana');

CREATE TABLE IF NOT EXISTS Departamentos (
    id_departamento INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);
INSERT INTO Departamentos (nombre) VALUES 
('Informática'), ('Matemáticas'), ('Lengua y Literatura'), ('Administrativo');

CREATE TABLE IF NOT EXISTS Asignaturas (
    id_asignatura INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);
INSERT INTO Asignaturas (nombre) VALUES 
('Programación'), ('Bases de Datos'), ('Inglés Técnico'), ('Sistemas Informáticos');

-- 2. HERENCIA DE USUARIOS (ENTIDADES SEPARADAS)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS Usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    id_rol INT NOT NULL,
    FOREIGN KEY (id_rol) REFERENCES Roles(id_rol) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Alumnos (
    id_usuario INT PRIMARY KEY,
    id_curso INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_curso) REFERENCES Cursos(id_curso) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Profesores (
    id_usuario INT PRIMARY KEY,
    id_departamento INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_departamento) REFERENCES Departamentos(id_departamento) ON DELETE RESTRICT
);

-- 3. ACTIVIDAD (DISPONIBILIDAD, TUTORÍAS, NOTIFICACIONES)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS Disponibilidad (
    id_disponibilidad INT AUTO_INCREMENT PRIMARY KEY,
    id_profesor INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    CHECK (hora_fin > hora_inicio),
    FOREIGN KEY (id_profesor) REFERENCES Profesores(id_usuario) ON DELETE CASCADE,
    INDEX idx_profesor_fecha (id_profesor, fecha)
);

CREATE TABLE IF NOT EXISTS Tutorias (
    id_tutoria INT AUTO_INCREMENT PRIMARY KEY,
    id_profesor INT NOT NULL,
    id_alumno INT NOT NULL,
    id_asignatura INT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado ENUM('reservada', 'cancelada', 'completada') DEFAULT 'reservada',
    motivo TEXT,
    CHECK (hora_fin > hora_inicio),
    FOREIGN KEY (id_profesor) REFERENCES Profesores(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_alumno) REFERENCES Alumnos(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_asignatura) REFERENCES Asignaturas(id_asignatura) ON DELETE SET NULL,
    INDEX idx_fecha_hora (fecha, hora_inicio)
);

CREATE TABLE IF NOT EXISTS Notificaciones (
    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    mensaje VARCHAR(255) NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Comentarios_Tutoria (
    id_comentario INT AUTO_INCREMENT PRIMARY KEY,
    id_tutoria INT NOT NULL,
    id_autor INT NOT NULL,
    texto TEXT NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_tutoria) REFERENCES Tutorias(id_tutoria) ON DELETE CASCADE,
    FOREIGN KEY (id_autor) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE
);

-- Mapeo de Profesores a Asignaturas (N:M)
CREATE TABLE IF NOT EXISTS Profesor_Asignatura (
    id_profesor INT NOT NULL,
    id_asignatura INT NOT NULL,
    PRIMARY KEY (id_profesor, id_asignatura),
    FOREIGN KEY (id_profesor) REFERENCES Profesores(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_asignatura) REFERENCES Asignaturas(id_asignatura) ON DELETE CASCADE
);