const db = require('../db');

exports.saveMessage = async (req, res) => {
  const { sender_id, receiver_id, content } = req.body;
  try {
    await db.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [sender_id, receiver_id, content]
    );
    res.send('✅ 메시지 저장 완료');
  } catch (err) {
    res.status(500).send('❌ 메시지 저장 실패: ' + err.message);
  }
};

exports.getMessages = async (req, res) => {
  const { sender_id, receiver_id } = req.query;
  try {
    const [rows] = await db.query(
      'SELECT * FROM messages WHERE sender_id = ? AND receiver_id = ? ORDER BY created_at',
      [sender_id, receiver_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).send('❌ 메시지 조회 실패: ' + err.message);
  }
};
