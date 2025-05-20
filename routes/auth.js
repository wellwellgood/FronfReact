// routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../pgPool.js");

const router = express.Router();

// 로그인
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const client = await pool.connect();

  try {
    const result = await client.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ message: "아이디가 존재하지 않습니다." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });

    const token = jwt.sign({ id: user.id, username: user.username }, "your_secret_key", { expiresIn: "1h" });

    res.status(200).json({ message: "로그인 성공", token });
  } catch (err) {
    console.error("❌ 로그인 오류:", err);
    res.status(500).json({ message: "서버 오류 발생" });
  } finally {
    client.release();
  }
});

// 회원가입
router.post("/register", async (req, res) => {
  const { username, name, password, confirmPassword, phone1, phone2, phone3 } = req.body;

  if (!username || !name || !password || !confirmPassword || !phone1 || !phone2 || !phone3) {
    return res.status(400).json({ message: "모든 필드를 입력해주세요." });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "비밀번호가 일치하지 않습니다." });
  }

  const client = await pool.connect();

  try {
    const result = await client.query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length > 0) {
      return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
    }

    const hashed = await bcrypt.hash(password, 10);
    await client.query(
      "INSERT INTO users (username, name, password, phone1, phone2, phone3) VALUES ($1, $2, $3, $4, $5, $6)",
      [username, name, hashed, phone1, phone2, phone3]
    );

    res.status(201).json({ message: "회원가입 성공" });

    // 인증번호 보내기 필요하면 여기 추가
  } catch (err) {
    console.error("❌ 회원가입 오류:", err);
    res.status(500).json({ message: "서버 오류 발생" });
  } finally {
    client.release();
  }
});

module.exports = router;
