// src/controller/adminController.js

const User = require("../models/userSchema");

// ── Analytics ──────────────────────────────
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const bannedUsers = await User.countDocuments({ banned: true });
    const activeUsers = await User.countDocuments({
      role: "user",
      banned: false
    });

    // আজকের নতুন users
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayUsers = await User.countDocuments({
      createdAt: { $gte: today }
    });

    res.status(200).json({
      totalUsers,
      bannedUsers,
      activeUsers,
      todayUsers
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── All Users ──────────────────────────────
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const users = await User.find({ role: "user" })
      .select("-password") // password বাদ দাও
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ role: "user" });

    res.status(200).json({
      users,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const banUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { banned: true },
      { returnDocument: "after" }  // ✅ new: true এর বদলে
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User banned", user });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const unbanUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { banned: false },
      { returnDocument: "after" }  // ✅ new: true এর বদলে
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User unbanned", user });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Delete User ────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log("Delete request for id:", id);        // 👈
    console.log("Admin user id:", req.result._id);       // 👈

    if (id === req.result._id.toString()) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }

    const deleted = await User.findByIdAndDelete(id);
    console.log("Deleted user:", deleted);             // 👈

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted" });

  } catch (err) {
      console.error("Delete error:", err.message);  
       res.status(500).json({ message: err.message });
  }
};

module.exports = { getStats, getUsers, banUser, unbanUser, deleteUser };