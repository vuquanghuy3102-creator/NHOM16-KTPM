let adminHotels = [];

function requireAdmin() {
  const user = getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    location.href = "/login.html";
    return false;
  }
  return true;
}

function showTab(name) {
  document.querySelectorAll(".admin-section").forEach(el => el.classList.add("hidden"));
  document.getElementById(`${name}Section`).classList.remove("hidden");

  document.querySelectorAll(".admin-tabs button").forEach(btn => btn.classList.remove("active"));
  document.querySelector(`[data-tab="${name}"]`).classList.add("active");

  const loaders = {
    hotels: loadHotels,
    rooms: loadRooms,
    customers: loadCustomers,
    bookings: loadAdminBookings
  };
  loaders[name]?.();
}

async function loadDashboard() {
  const result = await api("/admin/dashboard");
  document.getElementById("countHotels").textContent = result.data.hotels;
  document.getElementById("countRooms").textContent = result.data.rooms;
  document.getElementById("countCustomers").textContent = result.data.customers;
  document.getElementById("countBookings").textContent = result.data.bookings;
}

async function loadHotels() {
  const result = await api("/admin/hotels");
  adminHotels = result.data;

  document.getElementById("hotelTableBody").innerHTML = result.data.map(h => `
    <tr>
      <td>${h.id}</td>
      <td>${escapeHtml(h.name)}</td>
      <td>${escapeHtml(h.city)}</td>
      <td>${h.star_rating}</td>
      <td>
        <div class="inline-actions">
          <button class="btn btn-secondary btn-small" onclick="editHotel(${h.id})">Edit</button>
          <button class="btn btn-danger btn-small" onclick="deleteHotel(${h.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");

  const hotelSelect = document.getElementById("roomHotelId");
  hotelSelect.innerHTML = result.data.map(h =>
    `<option value="${h.id}">${escapeHtml(h.name)}</option>`
  ).join("");
}


async function editHotel(id) {
  const hotel = adminHotels.find(h => h.id === id);
  if (!hotel) return;

  const name = prompt("Hotel name:", hotel.name);
  if (name === null) return;
  const city = prompt("City:", hotel.city);
  if (city === null) return;
  const address = prompt("Address:", hotel.address);
  if (address === null) return;
  const starRating = prompt("Star rating (1-5):", hotel.star_rating);
  if (starRating === null) return;
  const description = prompt("Description:", hotel.description || "");
  if (description === null) return;

  try {
    await api(`/admin/hotels/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, city, address, starRating: Number(starRating), description })
    });
    await loadHotels();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteHotel(id) {
  if (!confirm("Delete this hotel and its rooms?")) return;
  try {
    await api(`/admin/hotels/${id}`, { method: "DELETE" });
    await loadHotels();
    await loadDashboard();
  } catch (error) {
    alert(error.message);
  }
}

async function loadRooms() {
  if (!adminHotels.length) await loadHotels();
  const result = await api("/admin/rooms");

  document.getElementById("roomTableBody").innerHTML = result.data.map(r => `
    <tr>
      <td>${r.id}</td>
      <td>${escapeHtml(r.hotel_name)}</td>
      <td>${escapeHtml(r.room_number)}</td>
      <td>${escapeHtml(r.room_type)}</td>
      <td>${money(r.price)}</td>
      <td>${r.capacity}</td>
      <td>
        <select onchange="updateRoomStatus(${r.id}, this.value)">
          ${["AVAILABLE", "BOOKED", "OCCUPIED", "MAINTENANCE"].map(s =>
            `<option value="${s}" ${r.status === s ? "selected" : ""}>${s}</option>`
          ).join("")}
        </select>
      </td>
      <td>
        <div class="inline-actions">
          <button class="btn btn-secondary btn-small" onclick='editRoom(${JSON.stringify(r)})'>Edit</button>
          <button class="btn btn-danger btn-small" onclick="deleteRoom(${r.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}


async function editRoom(room) {
  const roomNumber = prompt("Room number:", room.room_number);
  if (roomNumber === null) return;
  const roomType = prompt("Room type:", room.room_type);
  if (roomType === null) return;
  const price = prompt("Price:", room.price);
  if (price === null) return;
  const capacity = prompt("Capacity:", room.capacity);
  if (capacity === null) return;
  const description = prompt("Description:", room.description || "");
  if (description === null) return;

  try {
    await api(`/admin/rooms/${room.id}`, {
      method: "PUT",
      body: JSON.stringify({
        roomNumber,
        roomType,
        price: Number(price),
        capacity: Number(capacity),
        description
      })
    });
    await loadRooms();
  } catch (error) {
    alert(error.message);
  }
}

async function updateRoomStatus(id, status) {
  try {
    await api(`/admin/rooms/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
  } catch (error) {
    alert(error.message);
    loadRooms();
  }
}

async function deleteRoom(id) {
  if (!confirm("Delete this room?")) return;
  try {
    await api(`/admin/rooms/${id}`, { method: "DELETE" });
    loadRooms();
    loadDashboard();
  } catch (error) {
    alert(error.message);
  }
}

async function loadCustomers() {
  const result = await api("/admin/customers");
  document.getElementById("customerTableBody").innerHTML = result.data.map(c => `
    <tr>
      <td>${c.user_id}</td>
      <td>${escapeHtml(c.full_name)}</td>
      <td>${escapeHtml(c.email)}</td>
      <td>${escapeHtml(c.phone || "")}</td>
      <td>${escapeHtml(c.address || "")}</td>
    </tr>
  `).join("");
}

async function loadAdminBookings() {
  const result = await api("/admin/bookings");
  document.getElementById("adminBookingTableBody").innerHTML = result.data.map(b => `
    <tr>
      <td>${b.id}</td>
      <td>${escapeHtml(b.full_name || b.email)}</td>
      <td>${escapeHtml(b.hotel_name)}</td>
      <td>${escapeHtml(b.room_number)}</td>
      <td>${b.check_in}<br>${b.check_out}</td>
      <td>${money(b.total_price)}</td>
      <td>
        <select onchange="updateBookingStatus(${b.id}, this.value)">
          ${["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].map(s =>
            `<option value="${s}" ${b.status === s ? "selected" : ""}>${s}</option>`
          ).join("")}
        </select>
      </td>
    </tr>
  `).join("");
}

async function updateBookingStatus(id, status) {
  try {
    await api(`/admin/bookings/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
  } catch (error) {
    alert(error.message);
    loadAdminBookings();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAdmin()) return;

  try {
    await loadDashboard();
    await loadHotels();
  } catch (error) {
    alert(error.message);
  }

  document.querySelectorAll(".admin-tabs button").forEach(button => {
    button.addEventListener("click", () => showTab(button.dataset.tab));
  });

  document.getElementById("hotelForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      await api("/admin/hotels", {
        method: "POST",
        body: JSON.stringify(data)
      });
      event.currentTarget.reset();
      await loadHotels();
      await loadDashboard();
      showMessage("hotelMessage", "Hotel created successfully", "success");
    } catch (error) {
      showMessage("hotelMessage", error.message);
    }
  });

  document.getElementById("roomForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      await api("/admin/rooms", {
        method: "POST",
        body: JSON.stringify(data)
      });
      event.currentTarget.reset();
      await loadRooms();
      await loadDashboard();
      showMessage("roomMessage", "Room created successfully", "success");
    } catch (error) {
      showMessage("roomMessage", error.message);
    }
  });
});
