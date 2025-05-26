const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 60000,
});

// ✅ 연결 확인 함수 (선택)
async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    await client.query("SELECT NOW()");
    console.log("✅ DB 연결 성공");
  } catch (err) {
    console.error("❌ DB 연결 실패:", err.message);
  } finally {
    if (client) client.release();
  }
}

// 👉 pool만 내보내기 (깔끔하게)
module.exports = pool;
