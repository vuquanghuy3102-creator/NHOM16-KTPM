const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb } = require("../src/db");
const { authRequired, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, fullName, phone = "" } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Email, password and full name are required"
      });
    }

    if (!validEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters"
      });
    }

    const db = await getDb();
    const existing = await db.get(
      "SELECT id FROM users WHERE LOWER(email) = LOWER(?)",
      [email.trim()]
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.exec("BEGIN TRANSACTION");
    try {
      const result = await db.run(
        "INSERT INTO users(email, password, role) VALUES (?, ?, 'CUSTOMER')",
        [email.trim().toLowerCase(), hashedPassword]
      );

      await db.run(
        "INSERT INTO customers(user_id, full_name, phone) VALUES (?, ?, ?)",
        [result.lastID, fullName.trim(), phone.trim()]
      );

      await db.exec("COMMIT");
    } catch (error) {
      await db.exec("ROLLBACK");
      throw error;
    }

    res.status(201).json({
      success: true,
      message: "Account created successfully"
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const db = await getDb();
    const user = await db.get(
      `SELECT u.id, u.email, u.password, u.role, c.full_name
       FROM users u
       LEFT JOIN customers c ON c.user_id = u.id
       WHERE LOWER(u.email) = LOWER(?)`,
      [email.trim()]
    );

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.full_name
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", authRequired, (req, res) => {
  res.json({
    success: true,
    message: "Logout successful. Remove the token on the client."
  });
});

router.get("/me", authRequired, async (req, res, next) => {
  try {
    const db = await getDb();
    const user = await db.get(
      `SELECT u.id, u.email, u.role, u.created_at,
              c.full_name, c.phone, c.address, c.date_of_birth, c.identity_number
       FROM users u
       LEFT JOIN customers c ON c.user_id = u.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
