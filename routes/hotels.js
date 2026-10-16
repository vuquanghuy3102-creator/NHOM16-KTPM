const express = require("express");
const { getDb } = require("../src/db");

const router = express.Router();

async function searchHotels(req, res, next) {
  try {
    const { city = "", keyword = "", minPrice, maxPrice, stars } = req.query;
    const db = await getDb();

    const params = [];
    const where = [];

    if (city) {
      where.push("LOWER(h.city) LIKE LOWER(?)");
      params.push(`%${city}%`);
    }

    if (keyword) {
      where.push(`(
        LOWER(h.name) LIKE LOWER(?) OR
        LOWER(h.description) LIKE LOWER(?) OR
        LOWER(COALESCE(h.keywords, '')) LIKE LOWER(?) OR
        LOWER(h.city) LIKE LOWER(?)
      )`);
      const key = `%${keyword}%`;
      params.push(key, key, key, key);
    }

    if (stars) {
      const starValue = Number(stars);
      if (Number.isInteger(starValue) && starValue >= 1 && starValue <= 5) {
        where.push("h.star_rating = ?");
        params.push(starValue);
      }
    }

    let having = [];
    if (minPrice !== undefined && minPrice !== "") {
      const value = Number(minPrice);
      if (Number.isNaN(value) || value < 0) {
        return res.status(400).json({ success: false, message: "minPrice must be a non-negative number" });
      }
      having.push("MIN(r.price) >= ?");
      params.push(value);
    }

    if (maxPrice !== undefined && maxPrice !== "") {
      const value = Number(maxPrice);
      if (Number.isNaN(value) || value < 0) {
        return res.status(400).json({ success: false, message: "maxPrice must be a non-negative number" });
      }
      having.push("MIN(r.price) <= ?");
      params.push(value);
    }

    if (minPrice !== undefined && minPrice !== "" && maxPrice !== undefined && maxPrice !== "") {
      if (Number(minPrice) > Number(maxPrice)) {
        return res.status(400).json({ success: false, message: "minPrice cannot be greater than maxPrice" });
      }
    }

    const sql = `
      SELECT h.*,
             MIN(r.price) AS min_price,
             COUNT(r.id) AS room_count
      FROM hotels h
      LEFT JOIN rooms r ON r.hotel_id = h.id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      GROUP BY h.id
      ${having.length ? "HAVING " + having.join(" AND ") : ""}
      ORDER BY h.id DESC
    `;

    const hotels = await db.all(sql, params);
    res.json({ success: true, data: hotels });
  } catch (error) {
    next(error);
  }
}

router.get("/", searchHotels);
router.get("/search", searchHotels);


router.get("/:id/rooms", async (req, res, next) => {
  try {
    const db = await getDb();

    const hotel = await db.get("SELECT id FROM hotels WHERE id = ?", [req.params.id]);
    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    const rooms = await db.all(
      `SELECT id, hotel_id, room_number, room_type, price, capacity, description, status, image
       FROM rooms
       WHERE hotel_id = ?
       ORDER BY price ASC, room_number ASC`,
      [req.params.id]
    );

    res.json({ success: true, data: rooms });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const hotel = await db.get(
      `SELECT h.*, MIN(r.price) AS min_price, COUNT(r.id) AS room_count
       FROM hotels h
       LEFT JOIN rooms r ON r.hotel_id = h.id
       WHERE h.id = ?
       GROUP BY h.id`,
      [req.params.id]
    );

    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    res.json({ success: true, data: hotel });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
