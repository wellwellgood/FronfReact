// initDB.js
const pool = require("./DB");

const initDB = async () => {
  let client;
  try {
    client = await pool.getConnection(); // ✅ 오타 수정

    const createTableQuery = `
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

    await client.query(createTableQuery);
    console.log("✅ users 테이블 생성 완료");

  } catch (err) {
    console.error("❌ DB 초기화 실패:", err);
  } finally {
    if (client) client.release(); // ✅ 릴리즈는 finally에서 안전하게
  }
};

module.exports = initDB;