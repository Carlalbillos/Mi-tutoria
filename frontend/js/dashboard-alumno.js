// Validar sesión
window.onload = async () => {
  const role = localStorage.getItem("userRole");
  if (!role || role !== "alumno") {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("welcome-msg").textContent =
    `Hola, ${localStorage.getItem("userName")}! (${localStorage.getItem("userExtra")})`;

  await loadNotifications();
  await loadSubjects();
  await loadTeachers();
  await loadTutorings();
};

async function loadSubjects() {
  const select = document.getElementById("book-subject");
  try {
    const subjects = await ApiClient.request("/extras/asignaturas");
    subjects.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id_asignatura;
      opt.textContent = s.nombre;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error("Error cargando asignaturas", e);
  }
}

async function loadNotifications() {
  const pane = document.getElementById("notif-pane");
  const list = document.getElementById("notif-list");
  try {
    const notifs = await ApiClient.request("/notifications");
    if (notifs.length === 0) {
      pane.classList.add("hidden");
      return;
    }

    list.innerHTML = "";
    notifs.forEach((n) => {
      const li = document.createElement("li");
      li.className = "list-item";
      if (n.leida) li.style.opacity = "0.5";
      li.style.fontSize = "0.85rem";
      li.style.padding = "0.5rem";
      li.innerHTML = `
                <span>${n.mensaje}</span>
                <small style="display:block; color:var(--text-muted)">${new Date(n.fecha_creacion).toLocaleString()}</small>
            `;
      list.appendChild(li);
    });
    pane.classList.remove("hidden");
  } catch (e) {
    console.error("Error notificaciones", e);
  }
}

async function markAllNotifsRead() {
  try {
    await ApiClient.request("/notifications/read-all", "PATCH");
    await loadNotifications();
  } catch (e) {
    showAlert("Error al marcar leídas");
  }
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

function showAlert(message, type = "error") {
  const box = document.getElementById("alert-box");
  box.textContent = message;
  box.className = `alert alert-${type}`;
  box.classList.remove("hidden");
  setTimeout(() => {
    box.classList.add("hidden");
  }, 3000);
}

// -------- Cargar Profesores -------- //
let currentTeacherId = null;

async function loadTeachers() {
  const select = document.getElementById("book-teacher");
  try {
    const teachers = await ApiClient.request("/users/teachers");
    select.innerHTML = '<option value="">Elige un profesor...</option>';
    teachers.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id_usuario;
      opt.textContent = `${t.nombre} (${t.email})`;
      select.appendChild(opt);
    });
  } catch (err) {
    select.innerHTML = '<option value="">Error cargando profesores</option>';
  }
}

document
  .getElementById("book-teacher")
  .addEventListener("change", async (e) => {
    const val = e.target.value;
    const availWrapper = document.getElementById("availability-wrapper");
    const slotSelect = document.getElementById("book-slot");
    const btnBook = document.getElementById("btn-book");

    if (!val) {
      availWrapper.classList.add("hidden");
      btnBook.disabled = true;
      return;
    }

    try {
      currentTeacherId = val;
      const availabilities = await ApiClient.request(
        `/availability/teacher/${val}`,
      );

      slotSelect.innerHTML = '<option value="">Selecciona horario</option>';
      if (availabilities.length === 0) {
        slotSelect.innerHTML =
          '<option value="">Este profesor no tiene huecos</option>';
        btnBook.disabled = true;
      } else {
        availabilities.forEach((a) => {
          const opt = document.createElement("option");
          const dateStr = new Date(a.fecha).toLocaleDateString("es-ES");
          opt.value = JSON.stringify({
            fecha: a.fecha.split("T")[0],
            hora_inicio: a.hora_inicio,
            hora_fin: a.hora_fin,
          });
          opt.textContent = `${dateStr} | ${a.hora_inicio.slice(0, 5)} - ${a.hora_fin.slice(0, 5)}`;
          slotSelect.appendChild(opt);
        });
        btnBook.disabled = false;
      }
      availWrapper.classList.remove("hidden");
    } catch (err) {
      showAlert(err.message);
    }
  });

// -------- RESERVAR TUTORÍA -------- //
document.getElementById("book-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id_profesor = document.getElementById("book-teacher").value;
  const id_asignatura = document.getElementById("book-subject").value;
  const slotValue = document.getElementById("book-slot").value;
  const motivo = document.getElementById("book-reason").value;

  if (!id_profesor || !slotValue) {
    return showAlert("Rellena todos los campos");
  }

  const { fecha, hora_inicio, hora_fin } = JSON.parse(slotValue);

  try {
    await ApiClient.request("/tutorings", "POST", {
      id_profesor,
      id_asignatura: id_asignatura || null,
      fecha,
      hora_inicio,
      hora_fin,
      motivo,
    });

    showAlert("¡Reserva completada con éxito!", "success");
    document.getElementById("book-form").reset();
    document.getElementById("availability-wrapper").classList.add("hidden");
    document.getElementById("btn-book").disabled = true;
    await loadTutorings();
  } catch (err) {
    showAlert(err.message, "error");
  }
});

// -------- MIS TUTORÍAS -------- //
async function loadTutorings() {
  const list = document.getElementById("tutoring-list");
  const historyList = document.getElementById("history-list");

  try {
    const data = await ApiClient.request("/tutorings");
    list.innerHTML = "";
    historyList.innerHTML = "";

    if (data.length === 0) {
      list.innerHTML =
        '<li class="list-item">No has reservado ninguna cita.</li>';
      historyList.innerHTML = '<li class="list-item">Historial vacío.</li>';
      return;
    }

    let activeCount = 0;
    let historyCount = 0;
    const now = new Date();

    data.forEach((item) => {
      const dateStr = new Date(item.fecha).toLocaleDateString("es-ES");
      const timeStr = item.hora_inicio.slice(0, 5);

      // Determinar si es historial
      const tutoringDate = new Date(
        `${item.fecha.split("T")[0]}T${item.hora_inicio}`,
      );
      const isHistory = item.estado !== "reservada" || tutoringDate < now;

      const li = document.createElement("li");
      li.className = "list-item";
      if (isHistory) li.style.opacity = "0.7";

      li.innerHTML = `
                <div style="flex-grow: 1;">
                    <strong>Prof: ${item.contraparte_nombre}</strong> 
                    ${item.asignatura_nombre ? `<span style="color:var(--primary-color); font-size:0.8rem;">[${item.asignatura_nombre}]</span>` : ""}
                    <span class="badge badge-${item.estado}">${item.estado}</span><br>
                    <small>${dateStr} a las ${timeStr}</small><br>
                    <small style="color:var(--text-muted)">${item.motivo}</small>
                </div>
                ${
                  !isHistory && item.estado === "reservada"
                    ? `
                    <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; color: #ef4444;" onclick="cancelTutoring(${item.id_tutoria})">Cancelar</button>
                `
                    : ""
                }
            `;

      if (isHistory) {
        historyList.appendChild(li);
        historyCount++;
      } else {
        list.appendChild(li);
        activeCount++;
      }
    });

    if (activeCount === 0)
      list.innerHTML =
        '<li class="list-item">No tienes próximas citas activas.</li>';
    if (historyCount === 0)
      historyList.innerHTML = '<li class="list-item">Historial vacío.</li>';
  } catch (error) {
    list.innerHTML =
      '<li class="list-item" style="color:red;">Error cargando tus tutorías.</li>';
  }
}

async function cancelTutoring(id) {
  if (!confirm("¿Seguro que quieres cancelar esta tutoría?")) return;
  try {
    await ApiClient.request(`/tutorings/${id}/status`, "PATCH", {
      estado: "cancelada",
    });
    showAlert("Tutoría cancelada", "success");
    await loadTutorings();
  } catch (error) {
    showAlert(error.message);
  }
}
