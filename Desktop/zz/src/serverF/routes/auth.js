const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../DB"); // default export된 pool
const router = express.Router();

// ✅ 토큰 생성 함수
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

// 유저정보 가져오기
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "토큰 없음" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ id: decoded.id, username: decoded.username, name: decoded.name });
  } catch (err) {
    console.error("❌ me 라우트 오류:", err.message);
    res.status(403).json({ message: "유효하지 않은 토큰" });
  }
});

// ✅ 회원가입
router.post("/register", async (req, res) => {
  const { username, password, name, phone1, phone2, phone3 } = req.body;
  const phone = `${phone1}-${phone2}-${phone3}`;

  let conn;
  try {
    conn = await pool.connect();

    const check = await conn.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (check.rows.length > 0) {
      return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await conn.query(
      `INSERT INTO users (username, password, name, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [username, hashedPassword, name, phone]
    );

    res.status(201).json({ message: "회원가입 성공", userId: result.rows[0].id });

  } catch (err) {
    console.error("❌ register 오류:", err.message);
    res.status(500).json({ message: "서버 오류" });
  } finally {
    if (conn) conn.release();
  }
});

// ✅ 로그인
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "입력 누락" });

  console.log("🧪 로그인 시도:", username);
  console.log("🧪 비밀번호 입력값:", password);

  let conn;
  try {
    conn = await pool.connect();
    const result = await conn.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ message: "아이디가 존재하지 않습니다." });

    const user = result.rows[0];
    console.log("🧪 DB 저장된 비밀번호:", user.password);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🧪 bcrypt 비교 결과:", isMatch);

    if (!isMatch)
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "로그인 성공",
      accessToken,
      username: user.username,
      name: user.name
    });
  } catch (err) {
    console.error("❌ login 오류:", err.message);
    res.status(500).json({ message: "서버 오류" });
  } finally {
    if (conn) conn.release();
  }
});

// ✅ 아이디 찾기
router.post("/find-id", async (req, res) => {
  const { name, phone1, phone2, phone3 } = req.body;
  const phone = `${phone1}-${phone2}-${phone3}`;

  let conn;
  try {
    conn = await pool.connect();
    const result = await conn.query(
      "SELECT username FROM users WHERE name = $1 AND phone = $2",
      [name, phone]
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

// ✅ 비밀번호 찾기
router.post("/find-password", async (req, res) => {
  const { username, name, phone1, phone2, phone3 } = req.body;
  const phone = `${phone1}-${phone2}-${phone3}`;

  let conn;
  try {
    conn = await pool.connect();
    const result = await conn.query(
      "SELECT * FROM users WHERE username = $1 AND name = $2 AND phone = $3",
      [username, name, phone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "일치하는 계정 정보가 없습니다." });
    }

    const token = generateAccessToken(result.rows[0]);
    res.status(200).json({ message: "비밀번호 찾기 성공", token });

  } catch (err) {
    console.error("❌ find-password 오류:", err.message);
    res.status(500).json({ message: "서버 오류" });
  } finally {
    if (conn) conn.release();
  }
});

// ✅ 토큰 재발급
router.post("/token", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ message: "Refresh Token 없음" });

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
    if (err)
      return res.status(403).json({ message: "Refresh Token 유효하지 않음" });

    let conn;
    try {
      conn = await pool.connect();
      const result = await conn.query(
        "SELECT * FROM users WHERE id = $1",
        [decoded.id]
      );

      if (result.rows.length === 0)
        return res.status(404).json({ message: "사용자 없음" });

      const newAccessToken = generateAccessToken(result.rows[0]);
      res.status(200).json({ accessToken: newAccessToken });
    } catch (err) {
      console.error("❌ 토큰 재발급 오류:", err.message);
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
