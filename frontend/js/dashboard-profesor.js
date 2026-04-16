// Validar sesión
window.onload = async () => {
  const role = localStorage.getItem("userRole");
  if (!role || role !== "profesor") {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("welcome-msg").textContent =
    `Hola, ${localStorage.getItem("userName")}! (${localStorage.getItem("userExtra")})`;

  // Bloquear fechas pasadas en el calendario
  document.getElementById("avail-day").min = new Date()
    .toISOString()
    .split("T")[0];

  // Cargar datos
  await loadNotifications();
  await loadAvailability();
  await loadTutorings();
};

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
  }, 4000);
}

// -------- DISPONIBILIDAD -------- //
async function loadAvailability() {
  const list = document.getElementById("avail-list");
  try {
    const profile = await ApiClient.request("/users/profile"); // Sacamos nuestro id
    const teacherId = profile.id_usuario;

    const data = await ApiClient.request(`/availability/teacher/${teacherId}`);
    list.innerHTML = "";
    if (data.length === 0) {
      list.innerHTML =
        '<li class="list-item">No has definido ningún bloque.</li>';
      return;
    }

    data.forEach((item) => {
      const li = document.createElement("li");
      li.className = "list-item";
      li.innerHTML = `
                <div>
                    <strong>${new Date(item.fecha).toLocaleDateString("es-ES")}</strong><br>
                    <small>${item.hora_inicio.slice(0, 5)} - ${item.hora_fin.slice(0, 5)}</small>
                </div>
                <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; color: #ef4444;" onclick="deleteAvailability(${item.id_disponibilidad})">Eliminar</button>
            `;
      list.appendChild(li);
    });
  } catch (error) {
    list.innerHTML =
      '<li class="list-item" style="color:red;">Error cargando horarios.</li>';
  }
}

document.getElementById("avail-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fecha = document.getElementById("avail-day").value;
  const hora_inicio = document.getElementById("avail-start").value;
  const hora_fin = document.getElementById("avail-end").value;

  try {
    await ApiClient.request("/availability", "POST", {
      fecha,
      hora_inicio,
      hora_fin,
    });
    showAlert("Bloque añadido correctamente", "success");
    document.getElementById("avail-form").reset();
    await loadAvailability();
  } catch (error) {
    showAlert(error.message);
  }
});

async function deleteAvailability(id) {
  if (!confirm("¿Eliminar bloque horario?")) return;
  try {
    await ApiClient.request(`/availability/${id}`, "DELETE");
    showAlert("Bloque eliminado", "success");
    await loadAvailability();
  } catch (error) {
    showAlert(error.message);
  }
}

// -------- TUTORÍAS -------- //
async function loadTutorings() {
  const list = document.getElementById("tutoring-list");
  const historyList = document.getElementById("history-list");

  try {
    const data = await ApiClient.request("/tutorings");
    list.innerHTML = "";
    historyList.innerHTML = "";

    if (data.length === 0) {
      list.innerHTML =
        '<li class="list-item">No tienes tutorías reservadas.</li>';
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
      // Si es historial, le bajamos un poco la opacidad para que parezca "pasado"
      if (isHistory) li.style.opacity = "0.7";

      li.innerHTML = `
                <div style="flex-grow: 1;">
                    <strong>${item.contraparte_nombre}</strong> 
                    ${item.asignatura_nombre ? `<span style="color:var(--primary-color); font-size:0.8rem;">[${item.asignatura_nombre}]</span>` : ""}
                    <span class="badge badge-${item.estado}">${item.estado}</span><br>
                    <small>${dateStr} a las ${timeStr}</small><br>
                    <small style="color:var(--text-muted)">Motivo: ${item.motivo || "No indicado"}</small>
                </div>
                ${
                  !isHistory && item.estado === "reservada"
                    ? `
                    <div style="display:flex; gap:0.5rem; margin-left:1rem;">
                        <button class="btn btn-primary" style="padding: 0.25rem 0.5rem;" onclick="updateStatus(${item.id_tutoria}, 'completada')">✔</button>
                        <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; color: #ef4444;" onclick="updateStatus(${item.id_tutoria}, 'cancelada')">✖</button>
                    </div>
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
      '<li class="list-item" style="color:red;">Error cargando tutorías.</li>';
  }
}

async function updateStatus(id, estado) {
  if (!confirm(`¿Marcar tutoría como ${estado}?`)) return;
  try {
    await ApiClient.request(`/tutorings/${id}/status`, "PATCH", { estado });
    showAlert(`Tutoría ${estado}`, "success");
    await loadTutorings();
  } catch (error) {
    showAlert(error.message);
  }
}
