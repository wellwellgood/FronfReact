// ✅ routes/auth.js - MariaDB 연동 버전
const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../DB.js");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, name, password, confirmPassword, phone1, phone2, phone3 } = req.body;
  if (!username || !name || !password || !confirmPassword || !phone1 || !phone2 || !phone3) {
    return res.status(400).json({ message: "모든 항목을 입력해주세요." });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
  }
  const phone = `${phone1}-${phone2}-${phone3}`;
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM users WHERE username = ?", [username]);
    if (rows.length > 0) {
      conn.release();
      return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
    }
    const hash = await bcrypt.hash(password, 10);
    await conn.query("INSERT INTO users (username, name, password, phone) VALUES (?, ?, ?, ?)", [username, name, hash, phone]);
    conn.release();
    res.status(201).json({ message: "회원가입 성공" });
  } catch (err) {
    console.error("❌ DB 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
