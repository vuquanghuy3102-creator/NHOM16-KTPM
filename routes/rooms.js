const express = require("express");
const { getDb } = require("../src/db");

const router = express.Router();

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "") && !Number.isNaN(Date.parse(value));
}

function isDateRangeValid(checkIn, checkOut) {
  return validDate(checkIn) &&
         validDate(checkOut) &&
         new Date(checkOut) > new Date(checkIn);
}

router.get("/search", async (req, res, next) => {
  try {
    const { hotelId, checkIn, checkOut, guests = 1 } = req.query;

    if (!hotelId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "hotelId, checkIn and checkOut are required"
      });
    }

    if (!isDateRangeValid(checkIn, checkOut)) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-in/check-out date range"
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
    const rooms = await db.all(
      `SELECT r.*, h.name AS hotel_name
       FROM rooms r
       JOIN hotels h ON h.id = r.hotel_id
       WHERE r.hotel_id = ?
         AND r.capacity >= ?
         AND r.status = 'AVAILABLE'
         AND NOT EXISTS (
           SELECT 1
           FROM bookings b
           WHERE b.room_id = r.id
             AND b.status IN ('PENDING', 'CONFIRMED')
             AND NOT (? >= b.check_out OR ? <= b.check_in)
         )
       ORDER BY r.price ASC`,
      [hotelId, guestCount, checkIn, checkOut]
    );

    res.json({ success: true, data: rooms });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/availability", async (req, res, next) => {
  try {
    const { checkIn, checkOut } = req.query;

    if (!isDateRangeValid(checkIn, checkOut)) {
      return res.status(400).json({
        success: false,
        message: "Valid checkIn and checkOut are required"
      });
    }

    const db = await getDb();
    const room = await db.get("SELECT * FROM rooms WHERE id = ?", [req.params.id]);

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (room.status !== "AVAILABLE") {
      return res.json({
        success: true,
        data: { available: false, reason: `Room status is ${room.status}` }
      });
    }

    const conflict = await db.get(
      `SELECT id
       FROM bookings
       WHERE room_id = ?
         AND status IN ('PENDING', 'CONFIRMED')
         AND NOT (? >= check_out OR ? <= check_in)
       LIMIT 1`,
      [req.params.id, checkIn, checkOut]
    );

    res.json({
      success: true,
      data: { available: !conflict }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const room = await db.get(
      `SELECT r.*, h.name AS hotel_name, h.city, h.address
       FROM rooms r
       JOIN hotels h ON h.id = r.hotel_id
       WHERE r.id = ?`,
      [req.params.id]
    );

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    res.json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
