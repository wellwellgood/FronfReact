const express = require("express");
const { default: pool } = require("../DB.js");

const router = express.Router();

// ✅ 모든 메시지 가져오기
router.get("/", async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query("SELECT * FROM messages ORDER BY time ASC");
    res.json(result.rows); // PostgreSQL은 rows에 데이터 있음
  } catch (err) {
    console.error("❌ 메시지 불러오기 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  } finally {
    if (client) client.release();
  }
});

// ✅ 메시지 저장
router.post("/", async (req, res) => {
  const { sender_username, receiver_username, sender_name, content } = req.body;
  if (!sender_username || !receiver_username || !sender_name || !content) {
    return res.status(400).json({ message: "필수 정보 누락" });
  }

  let client;
  try {
    client = await pool.connect();
    const time = new Date().toISOString();
    await client.query(
      "INSERT INTO messages (sender_username, receiver_username, sender_name, content, time) VALUES ($1, $2, $3, $4, $5)",
      [sender_username, receiver_username, sender_name, content, time]
    );
    res.status(201).json({ message: "메시지 저장 완료" });
  } catch (err) {
    console.error("❌ 메시지 저장 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  } finally {
    if (client) client.release();
  }
});

// ✅ 모든 유저 조회
router.get("/users", async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query("SELECT id, name FROM users");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ 유저 불러오기 오류:", err.message);
    res.status(500).json({ message: "서버 오류" });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;
