const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../DB");
const Coolsms = require("coolsms-node-sdk").default;
require("dotenv").config();

const sms = new Coolsms(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);
const sender = process.env.COOLSMS_SENDER_NUMBER;

console.log("SMS KEY:", process.env.COOLSMS_API_KEY);      // null이면 문제
console.log("SMS SECRET:", process.env.COOLSMS_API_SECRET);
console.log("SENDER:", process.env.COOLSMS_SENDER_NUMBER);

const verificationCodes = new Map(); // 메모리 저장소

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ✅ 인증번호 전송
router.post("/send-code", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: "전화번호가 누락되었습니다." });

  const code = generateCode();
  verificationCodes.set(phone, code);

  try {
    await sms.sendOne({
      to: phone.replace(/-/g, ""),
      from: sender,
      text: `[인증번호] ${code} (본인확인용)`,
    });

    console.log("✅ 인증번호 전송:", code);
    res.status(200).json({ success: true, code }); // ⚠️ 운영 시 code 제거
  } catch (err) {
    console.error("❌ 문자 전송 오류:", err.message);
    res.status(500).json({ success: false, message: "문자 전송 실패" });
  }
});

// ✅ 인증번호 검증
router.post("/verify-code", (req, res) => {
  const { phone, code } = req.body;
  const storedCode = verificationCodes.get(phone);

  if (storedCode === code) {
    verificationCodes.delete(phone);
    return res.status(200).json({ success: true });
  } else {
    return res.status(400).json({ success: false, message: "인증번호가 일치하지 않습니다." });
  }
});

// ✅ 회원가입
router.post("/register", async (req, res) => {
  const { username, password, name, phone } = req.body;
  if (!username || !password || !name || !phone) {
    return res.status(400).json({ message: "모든 항목을 입력해주세요." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const conn = await pool.connect();
    const existing = await conn.query("SELECT * FROM users WHERE username = $1", [username]);

    if (existing.rows.length > 0) {
      conn.release();
      return res.status(409).json({ message: "이미 존재하는 사용자입니다." });
    }

    await conn.query(
      "INSERT INTO users (username, password, name, phone) VALUES ($1, $2, $3, $4)",
      [username, hashedPassword, name, phone]
    );

    conn.release();
    res.status(201).json({ message: "회원가입 성공" });
  } catch (err) {
    console.error("❌ 회원가입 오류:", err.message);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 로그인
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "아이디와 비밀번호를 입력해주세요." });
  }

  try {
    const conn = await pool.connect();
    const result = await conn.query("SELECT * FROM users WHERE username = $1", [username]);
    conn.release();

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({ message: "로그인 성공", token });
  } catch (err) {
    console.error("❌ 로그인 오류:", err.message);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 아이디 찾기
router.post("/find-id", async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ message: "전화번호가 누락되었습니다." });
  }

  let conn;
  try {
    conn = await pool.connect();
    const result = await conn.query(
      "SELECT username FROM users WHERE phone = $1",
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "일치하는 사용자가 없습니다." });
    }

    res.status(200).json({
      message: "아이디 찾기 성공",
      username: result.rows[0].username,
    });

  } catch (err) {
    console.error("❌ find-id 오류:", err.message);
    res.status(500).json({ message: "서버 오류" });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
