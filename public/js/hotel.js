let currentHotelId = null;
let searchContext = null;

function getHotelId() {
  return new URLSearchParams(location.search).get("id");
}

function roomCard(room, bookable = false) {
  return `
    <div class="card room-card">
      <div>
        <span class="badge badge-${escapeHtml(room.status)}">${escapeHtml(room.status)}</span>
        <h3>${escapeHtml(room.room_type)} - Room ${escapeHtml(room.room_number)}</h3>
        <div class="room-meta">
          <span>Capacity: ${room.capacity}</span>
          <span>${escapeHtml(room.description || "")}</span>
        </div>
        <div class="price">${money(room.price)} / night</div>
      </div>
      <div>
        ${bookable
          ? `<button class="btn btn-primary" onclick="bookRoom(${room.id})">Book this room</button>`
          : `<span class="muted">Select dates above to check availability</span>`}
      </div>
    </div>
  `;
}

async function loadHotel() {
  currentHotelId = getHotelId();

  if (!currentHotelId) {
    document.getElementById("hotelDetail").innerHTML = "<p>Hotel ID is missing.</p>";
    return;
  }

  try {
    const [hotelResult, roomResult] = await Promise.all([
      api(`/hotels/${currentHotelId}`),
      api(`/hotels/${currentHotelId}/rooms`)
    ]);

    const h = hotelResult.data;

    document.getElementById("hotelDetail").innerHTML = `
      <div class="card">
        <img class="detail-image" src="${escapeHtml(h.image || '')}" alt="${escapeHtml(h.name)}">
        <div class="card-body">
          <div class="star">${"★".repeat(h.star_rating)}${"☆".repeat(5 - h.star_rating)}</div>
          <h1>${escapeHtml(h.name)}</h1>
          <p class="muted">${escapeHtml(h.address)}, ${escapeHtml(h.city)}</p>
          <p>${escapeHtml(h.description || "")}</p>
          <p>Starting from <span class="price">${money(h.min_price)}</span> / night</p>
        </div>
      </div>
    `;

    const list = document.getElementById("roomList");
    list.innerHTML = roomResult.data.length
      ? roomResult.data.map(room => roomCard(room, false)).join("")
      : "<p>This hotel has no rooms.</p>";
  } catch (error) {
    document.getElementById("hotelDetail").innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
}

async function searchRooms(event) {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(event.currentTarget).entries());
  searchContext = formData;

  const params = new URLSearchParams({
    hotelId: currentHotelId,
    checkIn: formData.checkIn,
    checkOut: formData.checkOut,
    guests: formData.guests
  });

  const list = document.getElementById("roomList");
  list.innerHTML = "<p>Checking availability...</p>";

  try {
    const result = await api(`/rooms/search?${params.toString()}`);

    if (!result.data.length) {
      list.innerHTML = "<p>No available rooms for the selected dates.</p>";
      return;
    }

    list.innerHTML = result.data.map(room => roomCard(room, true)).join("");
  } catch (error) {
    list.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
}

async function bookRoom(roomId) {
  if (!getToken()) {
    location.href = "/login.html";
    return;
  }

  if (!searchContext) {
    alert("Please select check-in and check-out dates first.");
    return;
  }

  const confirmed = confirm(
    `Book this room from ${searchContext.checkIn} to ${searchContext.checkOut}?`
  );
  if (!confirmed) return;

  try {
    const result = await api("/bookings", {
      method: "POST",
      body: JSON.stringify({
        roomId,
        checkIn: searchContext.checkIn,
        checkOut: searchContext.checkOut,
        guests: Number(searchContext.guests)
      })
    });

    alert(`Booking successful. Total: ${money(result.data.totalPrice)}`);
    location.href = "/bookings.html";
  } catch (error) {
    alert(error.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadHotel();
  document.getElementById("roomSearchForm").addEventListener("submit", searchRooms);

  const today = new Date().toISOString().slice(0, 10);
  const checkIn = document.getElementById("checkIn");
  const checkOut = document.getElementById("checkOut");
  checkIn.min = today;
  checkOut.min = today;

  checkIn.addEventListener("change", () => {
    checkOut.min = checkIn.value || today;
    if (checkOut.value && checkOut.value <= checkIn.value) {
      checkOut.value = "";
    }
  });
});
