// ✅ routes/auth.js - MariaDB + JWT 통합버전 (회원가입, 로그인, 아이디/비번 찾기)
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../DB.js");
const conn = await pool.getConnection();

const router = express.Router();

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

// ✅ 회원가입 (비번 비교용이지만 구조상 로그인 처리에 가까움)
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  let conn;

  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM `user` WHERE username = ?", [username]);
    const user = rows[0];

    if (!user) return res.status(401).json({ message: "아이디가 존재하지 않습니다." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({ message: "로그인 성공", token });
  } catch (err) {
    console.error("❌ register 오류:", err);
    res.status(500).json({ message: "서버 오류 발생" });
  } finally {
    if (conn) conn.release();
  }
});

// ✅ 로그인
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "입력 누락" });

  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM users WHERE username = ?", [username]);

    if (rows.length === 0) return res.status(401).json({ message: "유저 없음" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "비밀번호 틀림" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "로그인 성공", accessToken });
  } catch (err) {
    console.error("❌ login 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  } finally {
    if (conn) conn.release();
  }
});

// ✅ 아이디 찾기
router.post("/find-id", async (req, res) => {
  const { name, phone1, phone2, phone3 } = req.body;
  if (!name || !phone1 || !phone2 || !phone3) {
    return res.status(400).json({ message: "모든 정보를 입력해주세요." });
  }
  const phone = `${phone1}-${phone2}-${phone3}`;

  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT username FROM users WHERE name = ? AND phone = ?", [name, phone]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "일치하는 사용자가 없습니다." });
    }
    return res.status(200).json({ message: "아이디 찾기 성공", username: rows[0].username });
  } catch (err) {
    console.error("❌ 아이디 찾기 오류:", err);
    return res.status(500).json({ message: "서버 오류" });
  } finally {
    if (conn) conn.release();
  }
});

// ✅ 비밀번호 찾기
router.post("/find-password", async (req, res) => {
  const { username, name, phone1, phone2, phone3 } = req.body;
  if (!username || !name || !phone1 || !phone2 || !phone3) {
    return res.status(400).json({ message: "모든 정보를 입력해주세요." });
  }
  const phone = `${phone1}-${phone2}-${phone3}`;

  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM users WHERE username = ? AND name = ? AND phone = ?", [username, name, phone]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "일치하는 계정 정보가 없습니다." });
    }

    const token = generateAccessToken(rows[0]);
    return res.status(200).json({ message: "비밀번호 확인 성공", token });
  } catch (err) {
    console.error("❌ 비밀번호 찾기 오류:", err);
    return res.status(500).json({ message: "서버 오류" });
  } finally {
    if (conn) conn.release();
  }
});

// ✅ 토큰 재발급
router.post("/token", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: "Refresh Token 없음" });

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: "Refresh Token 유효하지 않음" });

    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query("SELECT * FROM users WHERE id = ?", [decoded.id]);

      if (rows.length === 0) return res.status(404).json({ message: "사용자 없음" });
      const newAccessToken = generateAccessToken(rows[0]);
      res.status(200).json({ accessToken: newAccessToken });
    } catch (err) {
      console.error("❌ 토큰 재발급 오류:", err);
      res.status(500).json({ message: "토큰 재발급 실패" });
    } finally {
      if (conn) conn.release();
    }
  });
});

// ✅ 로그아웃
router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "로그아웃 성공" });
});


module.exports = router;
