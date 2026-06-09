// src/route/adminRoutes.js

const express = require("express");
const router = express.Router();
const adminMiddleware = require("../middleware/adminMiddleware");
const {
  getStats,
  getUsers,
  banUser,
  unbanUser,
  deleteUser
} = require("../controler/adminController");

router.get("/stats", adminMiddleware, getStats);
router.get("/users", adminMiddleware, getUsers);
router.patch("/users/:id/ban", adminMiddleware, banUser);
router.patch("/users/:id/unban", adminMiddleware, unbanUser);
router.delete("/users/:id", adminMiddleware, deleteUser);

module.exports = router;