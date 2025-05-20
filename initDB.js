// initDB.js
const pool = require("./DB");

const initDB = async () => {
  try {
    const client = await pool.connect();

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(50),
        phone1 VARCHAR(10),
        phone2 VARCHAR(10),
        phone3 VARCHAR(10)
      )
    `;

    await client.query(createTableQuery);
    console.log("✅ users 테이블 생성 완료");

    client.release();
  } catch (err) {
    console.error("❌ DB 초기화 실패:", err);
  }
};

module.exports = initDB;