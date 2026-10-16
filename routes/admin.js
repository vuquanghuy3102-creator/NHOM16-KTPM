const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb } = require("../src/db");
const { authRequired, adminRequired, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const db = await getDb();

    const user = await db.get(
      "SELECT id, email, password, role FROM users WHERE LOWER(email) = LOWER(?)",
      [email || ""]
    );

    if (!user || user.role !== "ADMIN" || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid administrator credentials"
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      success: true,
      data: { token, user: { id: user.id, email: user.email, role: user.role } }
    });
  } catch (error) {
    next(error);
  }
});

router.use(authRequired, adminRequired);

router.get("/dashboard", async (req, res, next) => {
  try {
    const db = await getDb();
    const [hotels, rooms, customers, bookings] = await Promise.all([
      db.get("SELECT COUNT(*) AS count FROM hotels"),
      db.get("SELECT COUNT(*) AS count FROM rooms"),
      db.get("SELECT COUNT(*) AS count FROM users WHERE role = 'CUSTOMER'"),
      db.get("SELECT COUNT(*) AS count FROM bookings")
    ]);

    res.json({
      success: true,
      data: {
        hotels: hotels.count,
        rooms: rooms.count,
        customers: customers.count,
        bookings: bookings.count
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/hotels", async (req, res, next) => {
  try {
    const db = await getDb();
    const rows = await db.all("SELECT * FROM hotels ORDER BY id DESC");
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

router.post("/hotels", async (req, res, next) => {
  try {
    const { name, address, city, description = "", starRating = 3, image = "" } = req.body;

    if (!name || !address || !city) {
      return res.status(400).json({
        success: false,
        message: "Name, address and city are required"
      });
    }

    const stars = Number(starRating);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({
        success: false,
        message: "Star rating must be an integer from 1 to 5"
      });
    }

    const db = await getDb();
    const result = await db.run(
      `INSERT INTO hotels(name, address, city, description, star_rating, image)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name.trim(), address.trim(), city.trim(), description.trim(), stars, image.trim()]
    );

    res.status(201).json({
      success: true,
      message: "Hotel created successfully",
      data: { id: result.lastID }
    });
  } catch (error) {
    next(error);
  }
});

router.put("/hotels/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const current = await db.get("SELECT * FROM hotels WHERE id = ?", [req.params.id]);

    if (!current) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    const updated = {
      name: req.body.name ?? current.name,
      address: req.body.address ?? current.address,
      city: req.body.city ?? current.city,
      description: req.body.description ?? current.description,
      starRating: Number(req.body.starRating ?? current.star_rating),
      image: req.body.image ?? current.image
    };

    if (!Number.isInteger(updated.starRating) || updated.starRating < 1 || updated.starRating > 5) {
      return res.status(400).json({ success: false, message: "Star rating must be 1 to 5" });
    }

    await db.run(
      `UPDATE hotels
       SET name = ?, address = ?, city = ?, description = ?, star_rating = ?, image = ?
       WHERE id = ?`,
      [updated.name, updated.address, updated.city, updated.description, updated.starRating, updated.image, req.params.id]
    );

    res.json({ success: true, message: "Hotel updated successfully" });
  } catch (error) {
    next(error);
  }
});

router.delete("/hotels/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const result = await db.run("DELETE FROM hotels WHERE id = ?", [req.params.id]);

    if (!result.changes) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    res.json({ success: true, message: "Hotel deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.get("/rooms", async (req, res, next) => {
  try {
    const db = await getDb();
    const rows = await db.all(
      `SELECT r.*, h.name AS hotel_name
       FROM rooms r
       JOIN hotels h ON h.id = r.hotel_id
       ORDER BY r.id DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

router.post("/rooms", async (req, res, next) => {
  try {
    const { hotelId, roomNumber, roomType, price, capacity, description = "", status = "AVAILABLE" } = req.body;

    if (!hotelId || !roomNumber || !roomType || price === undefined || capacity === undefined) {
      return res.status(400).json({
        success: false,
        message: "hotelId, roomNumber, roomType, price and capacity are required"
      });
    }

    const priceValue = Number(price);
    const capacityValue = Number(capacity);

    if (!(priceValue > 0)) {
      return res.status(400).json({ success: false, message: "Price must be greater than 0" });
    }

    if (!Number.isInteger(capacityValue) || capacityValue < 1) {
      return res.status(400).json({ success: false, message: "Capacity must be an integer greater than 0" });
    }

    const allowed = ["AVAILABLE", "BOOKED", "OCCUPIED", "MAINTENANCE"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid room status" });
    }

    const db = await getDb();
    const hotel = await db.get("SELECT id FROM hotels WHERE id = ?", [hotelId]);
    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    try {
      const result = await db.run(
        `INSERT INTO rooms(hotel_id, room_number, room_type, price, capacity, description, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [hotelId, roomNumber.trim(), roomType.trim(), priceValue, capacityValue, description.trim(), status]
      );

      res.status(201).json({
        success: true,
        message: "Room created successfully",
        data: { id: result.lastID }
      });
    } catch (error) {
      if (String(error.message).includes("UNIQUE")) {
        return res.status(409).json({
          success: false,
          message: "Room number already exists in this hotel"
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

router.put("/rooms/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const current = await db.get("SELECT * FROM rooms WHERE id = ?", [req.params.id]);

    if (!current) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    const values = {
      roomNumber: req.body.roomNumber ?? current.room_number,
      roomType: req.body.roomType ?? current.room_type,
      price: Number(req.body.price ?? current.price),
      capacity: Number(req.body.capacity ?? current.capacity),
      description: req.body.description ?? current.description
    };

    if (!(values.price > 0) || !Number.isInteger(values.capacity) || values.capacity < 1) {
      return res.status(400).json({ success: false, message: "Invalid price or capacity" });
    }

    await db.run(
      `UPDATE rooms
       SET room_number = ?, room_type = ?, price = ?, capacity = ?, description = ?
       WHERE id = ?`,
      [values.roomNumber, values.roomType, values.price, values.capacity, values.description, req.params.id]
    );

    res.json({ success: true, message: "Room updated successfully" });
  } catch (error) {
    next(error);
  }
});

router.put("/rooms/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ["AVAILABLE", "BOOKED", "OCCUPIED", "MAINTENANCE"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be AVAILABLE, BOOKED, OCCUPIED or MAINTENANCE"
      });
    }

    const db = await getDb();
    const result = await db.run(
      "UPDATE rooms SET status = ? WHERE id = ?",
      [status, req.params.id]
    );

    if (!result.changes) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    res.json({ success: true, message: "Room status updated successfully" });
  } catch (error) {
    next(error);
  }
});

router.delete("/rooms/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const booking = await db.get(
      "SELECT id FROM bookings WHERE room_id = ? LIMIT 1",
      [req.params.id]
    );

    if (booking) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete a room that has booking history"
      });
    }

    const result = await db.run("DELETE FROM rooms WHERE id = ?", [req.params.id]);

    if (!result.changes) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    res.json({ success: true, message: "Room deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.get("/customers", async (req, res, next) => {
  try {
    const db = await getDb();
    const rows = await db.all(
      `SELECT u.id AS user_id, u.email, u.created_at,
              c.full_name, c.phone, c.address, c.date_of_birth, c.identity_number
       FROM users u
       JOIN customers c ON c.user_id = u.id
       WHERE u.role = 'CUSTOMER'
       ORDER BY u.id DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

router.get("/customers/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const row = await db.get(
      `SELECT u.id AS user_id, u.email, u.created_at,
              c.full_name, c.phone, c.address, c.date_of_birth, c.identity_number
       FROM users u
       JOIN customers c ON c.user_id = u.id
       WHERE u.id = ? AND u.role = 'CUSTOMER'`,
      [req.params.id]
    );

    if (!row) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.json({ success: true, data: row });
  } catch (error) {
    next(error);
  }
});

router.get("/bookings", async (req, res, next) => {
  try {
    const db = await getDb();
    const rows = await db.all(
      `SELECT b.*, u.email, c.full_name,
              r.room_number, r.room_type,
              h.name AS hotel_name
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       LEFT JOIN customers c ON c.user_id = u.id
       JOIN rooms r ON r.id = b.room_id
       JOIN hotels h ON h.id = r.hotel_id
       ORDER BY b.created_at DESC, b.id DESC`
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

router.put("/bookings/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid booking status" });
    }

    const db = await getDb();
    const current = await db.get("SELECT status FROM bookings WHERE id = ?", [req.params.id]);

    if (!current) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const disallowedTransitions = {
      CANCELLED: ["PENDING", "CONFIRMED", "COMPLETED"],
      COMPLETED: ["PENDING", "CONFIRMED", "CANCELLED"]
    };

    if (disallowedTransitions[current.status]?.includes(status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot change booking from ${current.status} to ${status}`
      });
    }

    await db.run("UPDATE bookings SET status = ? WHERE id = ?", [status, req.params.id]);

    res.json({ success: true, message: "Booking status updated successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
