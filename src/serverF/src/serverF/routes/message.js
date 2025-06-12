// routes/message.js
const express = require("express");
const pool = require("../pgPool.js");

const router = express.Router();

// 메시지 저장
router.post("/", async (req, res) => {
  const { sender_id, receiver_id, content } = req.body;
  const client = await pool.connect();

  try {
    await client.query(
      "INSERT INTO messages (sender_id, receiver_id, content, time) VALUES ($1, $2, $3, NOW())",
      [sender_id, receiver_id, content]
    );
    res.status(201).json({ message: "메시지 저장 완료" });
  } catch (err) {
    console.error("❌ 메시지 저장 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  } finally {
    client.release();
  }
});

// 메시지 불러오기
router.get("/api/messages", async (req, res) => {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT 
      m.*, 
      s.username AS sender_username, 
      r.username AS receiver_username
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      LEFT JOIN users r ON m.receiver_id = r.id
      ORDER BY m.time ASC
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ 메시지 불러오기 오류:", err);
    res.status(500).json({ message: "서버 오류" });
  } finally {
    client.release();
  }
});

module.exports = router;
