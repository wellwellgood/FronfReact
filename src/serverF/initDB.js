// initDB.js
const pool = require("./DB"); // DB 연결 정보는 DB.js에 있어야 함

const initDB = async () => {
  let conn;
  try {
    conn = await pool.getConnection();

    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(50),
        phone1 VARCHAR(10),
        phone2 VARCHAR(10),
        phone3 VARCHAR(10)
      )
    `;

    await conn.query(sql);
    console.log("✅ users 테이블 생성 완료");
  } catch (err) {
    console.error("❌ DB 초기화 실패:", err);
  } finally {
    if (conn) conn.release();
  }
};

module.exports = initDB;
