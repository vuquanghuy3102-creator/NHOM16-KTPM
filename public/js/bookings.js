async function loadBookings() {
  if (!getToken()) {
    location.href = "/login.html";
    return;
  }

  const list = document.getElementById("bookingList");
  list.innerHTML = "<p>Loading bookings...</p>";

  try {
    const result = await api("/bookings/my-bookings");

    if (!result.data.length) {
      list.innerHTML = "<p>You do not have any bookings yet.</p>";
      return;
    }

    list.innerHTML = result.data.map(booking => `
      <article class="card card-body" style="margin-bottom:14px">
        <div class="section-title" style="margin:0 0 10px">
          <div>
            <h3>${escapeHtml(booking.hotel_name)}</h3>
            <div class="muted">${escapeHtml(booking.city)} · Room ${escapeHtml(booking.room_number)} (${escapeHtml(booking.room_type)})</div>
          </div>
          <span class="badge badge-${escapeHtml(booking.status)}">${escapeHtml(booking.status)}</span>
        </div>
        <div class="grid grid-4">
          <div><strong>Check-in</strong><br>${escapeHtml(booking.check_in)}</div>
          <div><strong>Check-out</strong><br>${escapeHtml(booking.check_out)}</div>
          <div><strong>Guests</strong><br>${booking.guests}</div>
          <div><strong>Total</strong><br>${money(booking.total_price)}</div>
        </div>
        <div class="inline-actions" style="margin-top:16px">
          <button class="btn btn-secondary btn-small" onclick="viewBooking(${booking.id})">View detail</button>
          ${["PENDING", "CONFIRMED"].includes(booking.status)
            ? `<button class="btn btn-danger btn-small" onclick="cancelBooking(${booking.id})">Cancel booking</button>`
            : ""}
        </div>
      </article>
    `).join("");
  } catch (error) {
    list.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
}

async function cancelBooking(id) {
  if (!confirm("Are you sure you want to cancel this booking?")) return;

  try {
    await api(`/bookings/${id}/cancel`, { method: "PUT" });
    loadBookings();
  } catch (error) {
    alert(error.message);
  }
}

async function viewBooking(id) {
  try {
    const result = await api(`/bookings/${id}`);
    const b = result.data;
    alert(
      `Booking #${b.id}\nHotel: ${b.hotel_name}\nRoom: ${b.room_number}\n` +
      `Check-in: ${b.check_in}\nCheck-out: ${b.check_out}\nStatus: ${b.status}\n` +
      `Total: ${money(b.total_price)}`
    );
  } catch (error) {
    alert(error.message);
  }
}

document.addEventListener("DOMContentLoaded", loadBookings);
