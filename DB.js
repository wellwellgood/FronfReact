// DB.js
const { default : Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true',
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 60000,
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ✅ 연결 확인용 함수
async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    await client.query("SELECT NOW()");
    console.log("✅ DB 연결 성공");
    return true;
  } catch (err) {
    console.error("❌ DB 연결 실패:", err.message);
    return false;
  } finally {
    if (client) client.release();
  }
}

// ✅ 필요한 것들 내보내기
module.exports = {
  testConnection,
  default: pool,
};
