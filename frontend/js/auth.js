// Alternar entre Login y Registro
function toggleAuthView() {
  document.getElementById("login-form").classList.toggle("hidden");
  document.getElementById("register-form").classList.toggle("hidden");
  hideAlert();
}

function showAlert(message, type = "error") {
  const box = document.getElementById("alert-box");
  box.textContent = message;
  box.className = `alert alert-${type}`;
  box.classList.remove("hidden");
}

function hideAlert() {
  document.getElementById("alert-box").classList.add("hidden");
}

// Carga inicial coordinada: Cursos y Departamentos
window.onload = async () => {
  const userRole = localStorage.getItem("userRole");
  if (userRole) {
    window.location.href = `dashboard-${userRole}.html`;
    return;
  }

  try {
    // Cargar Cursos
    const cursos = await ApiClient.request("/extras/cursos");
    const selectCursos = document.getElementById("reg-course");
    cursos.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id_curso;
      opt.textContent = `${c.nombre} (${c.turno})`;
      selectCursos.appendChild(opt);
    });

    // Cargar Departamentos
    const depts = await ApiClient.request("/extras/departamentos");
    const selectDepts = document.getElementById("reg-dept");
    depts.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.id_departamento;
      opt.textContent = d.nombre;
      selectDepts.appendChild(opt);
    });
  } catch (e) {
    console.error("Error cargando catálogos", e);
  }
};

// Lógica de cambio de rol dinámico
document.getElementById("reg-role").addEventListener("change", (e) => {
  const courseGroup = document.getElementById("course-group");
  const deptGroup = document.getElementById("dept-group");
  const courseSelect = document.getElementById("reg-course");
  const deptSelect = document.getElementById("reg-dept");

  if (e.target.value === "profesor") {
    courseGroup.classList.add("hidden");
    deptGroup.classList.remove("hidden");
    courseSelect.required = false;
    deptSelect.required = true;
  } else {
    courseGroup.classList.remove("hidden");
    deptGroup.classList.add("hidden");
    courseSelect.required = true;
    deptSelect.required = false;
  }
});

// Login
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const btn = e.target.querySelector("button");
  btn.textContent = "Iniciando...";
  btn.disabled = true;

  try {
    const data = await ApiClient.request("/auth/login", "POST", {
      email,
      password,
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("userRole", data.user.rol);
    localStorage.setItem("userName", data.user.nombre);
    localStorage.setItem("userExtra", sessionRoleLabel(data.user));

    showAlert("Acceso exitoso. Redirigiendo...", "success");
    setTimeout(() => {
      window.location.href = `dashboard-${data.user.rol}.html`;
    }, 1000);
  } catch (error) {
    showAlert(error.message);
    btn.textContent = "Iniciar Sesión";
    btn.disabled = false;
  }
});

function sessionRoleLabel(user) {
  return user.rol === "alumno"
    ? `Curso: ${user.curso}`
    : `Depto: ${user.departamento}`;
}

// Registro
document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const nombre = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const nombre_rol = document.getElementById("reg-role").value;
    const id_curso =
      nombre_rol === "alumno"
        ? document.getElementById("reg-course").value
        : null;
    const id_departamento =
      nombre_rol === "profesor"
        ? document.getElementById("reg-dept").value
        : null;

    const btn = e.target.querySelector("button");
    btn.textContent = "Creando...";
    btn.disabled = true;

    try {
      await ApiClient.request("/auth/register", "POST", {
        nombre,
        email,
        password,
        nombre_rol,
        id_curso,
        id_departamento,
      });
      showAlert(
        "Cuenta creada exitosamente. Por favor, inicia sesión.",
        "success",
      );
      setTimeout(() => {
        toggleAuthView();
        document.getElementById("login-email").value = email;
        btn.textContent = "Crear Cuenta";
        btn.disabled = false;
      }, 2000);
    } catch (error) {
      showAlert(error.message);
      btn.textContent = "Crear Cuenta";
      btn.disabled = false;
    }
  });
