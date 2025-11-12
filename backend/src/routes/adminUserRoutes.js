const express = require("express");
const router = express.Router();
const User = require("../models/User");

// 🟩 Lấy danh sách user
router.get("/", async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server", error: err.message });
    }
});

// 🟦 Tạo user mới (chỉ admin mới được gọi API này)
router.post("/", async (req, res) => {
    try {
        const { name, email, password, role, subscription } = req.body;

        // Kiểm tra trùng email
        const exist = await User.findOne({ email });
        if (exist) return res.status(400).json({ message: "Email đã tồn tại" });

        const user = new User({
            name,
            email,
            password: password || null,
            role: role || "user",
            subscription: subscription || "free",
        });

        await user.save();
        res.json({ message: "Tạo tài khoản thành công", user });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server", error: err.message });
    }
});

// 🟨 Cập nhật user
router.put("/:id", async (req, res) => {
    try {
        const { name, email, role, subscription } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, role, subscription },
            { new: true }
        ).select("-password");
        if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server", error: err.message });
    }
});

// 🟥 Xóa user
router.delete("/:id", async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Đã xóa user" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server", error: err.message });
    }
});

module.exports = router;
