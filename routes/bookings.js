const express = require("express");
const { getDb } = require("../src/db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.use(authRequired);

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "") && !Number.isNaN(Date.parse(value));
}

function nightsBetween(checkIn, checkOut) {
  const start = new Date(checkIn + "T00:00:00Z");
  const end = new Date(checkOut + "T00:00:00Z");
  return Math.round((end - start) / 86400000);
}

router.post("/", async (req, res, next) => {
  try {
    const { roomId, checkIn, checkOut, guests } = req.body;

    if (!roomId || !checkIn || !checkOut || guests === undefined) {
      return res.status(400).json({
        success: false,
        message: "roomId, checkIn, checkOut and guests are required"
      });
    }

    if (!validDate(checkIn) || !validDate(checkOut)) {
      return res.status(400).json({
        success: false,
        message: "Dates must use YYYY-MM-DD format"
      });
    }

    const nights = nightsBetween(checkIn, checkOut);
    if (nights < 1) {
      return res.status(400).json({
        success: false,
        message: "Check-out date must be after check-in date"
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (checkIn < today) {
      return res.status(400).json({
        success: false,
        message: "Check-in date cannot be in the past"
      });
    }

    const guestCount = Number(guests);
    if (!Number.isInteger(guestCount) || guestCount < 1) {
      return res.status(400).json({
        success: false,
        message: "Guests must be an integer greater than 0"
      });
    }

    const db = await getDb();

    const room = await db.get(
      `SELECT r.*, h.name AS hotel_name
       FROM rooms r
       JOIN hotels h ON h.id = r.hotel_id
       WHERE r.id = ?`,
      [roomId]
    );

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (room.status !== "AVAILABLE") {
      return res.status(409).json({
        success: false,
        message: `Room is currently ${room.status}`
      });
    }

    if (guestCount > room.capacity) {
      return res.status(400).json({
        success: false,
        message: "Number of guests exceeds room capacity"
      });
    }

    const conflict = await db.get(
      `SELECT id
       FROM bookings
       WHERE room_id = ?
         AND status IN ('PENDING', 'CONFIRMED')
         AND NOT (? >= check_out OR ? <= check_in)
       LIMIT 1`,
      [roomId, checkIn, checkOut]
    );

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "Room is not available for selected dates"
      });
    }

    const totalPrice = nights * room.price;

    const result = await db.run(
      `INSERT INTO bookings(user_id, room_id, check_in, check_out, guests, total_price, status)
       VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
      [req.user.id, roomId, checkIn, checkOut, guestCount, totalPrice]
    );

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: {
        bookingId: result.lastID,
        hotelName: room.hotel_name,
        roomId: room.id,
        checkIn,
        checkOut,
        guests: guestCount,
        nights,
        totalPrice,
        status: "CONFIRMED"
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/my-bookings", async (req, res, next) => {
  try {
    const db = await getDb();
    const bookings = await db.all(
      `SELECT b.*, r.room_number, r.room_type, r.price,
              h.id AS hotel_id, h.name AS hotel_name, h.city
       FROM bookings b
       JOIN rooms r ON r.id = b.room_id
       JOIN hotels h ON h.id = r.hotel_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC, b.id DESC`,
      [req.user.id]
    );

    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
});

router.put("/:id/cancel", async (req, res, next) => {
  try {
    const db = await getDb();

    const booking = await db.get(
      "SELECT * FROM bookings WHERE id = ?",
      [req.params.id]
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You cannot cancel another user's booking"
      });
    }

    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      return res.status(409).json({
        success: false,
        message: `Booking with status ${booking.status} cannot be cancelled`
      });
    }

    await db.run(
      "UPDATE bookings SET status = 'CANCELLED' WHERE id = ?",
      [req.params.id]
    );

    res.json({
      success: true,
      message: "Booking cancelled successfully"
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const booking = await db.get(
      `SELECT b.*, r.room_number, r.room_type, r.price,
              h.id AS hotel_id, h.name AS hotel_name, h.city, h.address
       FROM bookings b
       JOIN rooms r ON r.id = b.room_id
       JOIN hotels h ON h.id = r.hotel_id
       WHERE b.id = ?`,
      [req.params.id]
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.user_id !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this booking"
      });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
