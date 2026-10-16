const express = require("express");
const bcrypt = require("bcryptjs");
const { getDb } = require("../src/db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();
router.use(authRequired);

router.get("/profile", async (req, res, next) => {
  try {
    const db = await getDb();
    const profile = await db.get(
      `SELECT u.id AS user_id, u.email, u.role, u.created_at,
              c.full_name, c.phone, c.address, c.date_of_birth, c.identity_number
       FROM users u
       LEFT JOIN customers c ON c.user_id = u.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
});

router.put("/profile", async (req, res, next) => {
  try {
    const {
      fullName,
      phone = "",
      address = "",
      dateOfBirth = "",
      identityNumber = ""
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required"
      });
    }

    if (phone && !/^[0-9]{9,11}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must contain 9 to 11 digits"
      });
    }

    const db = await getDb();
    await db.run(
      `UPDATE customers
       SET full_name = ?, phone = ?, address = ?, date_of_birth = ?, identity_number = ?
       WHERE user_id = ?`,
      [
        fullName.trim(),
        phone.trim(),
        address.trim(),
        dateOfBirth || null,
        identityNumber.trim(),
        req.user.id
      ]
    );

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    next(error);
  }
});

router.put("/change-password", async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 6 characters"
      });
    }

    const db = await getDb();
    const user = await db.get(
      "SELECT password FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db.run("UPDATE users SET password = ? WHERE id = ?", [hash, req.user.id]);

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
