// initDB.js
const { pool } = require("./DB");

// 최대 재시도 횟수와 대기 시간 설정
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5초

const initDB = async (retryCount = 0) => {
  let client;
  try {
    client = await pool.getConnection();

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
    return true;

  } catch (err) {
    console.error(`❌ DB 초기화 실패 (시도 ${retryCount + 1}/${MAX_RETRIES}):`, err.message);
    
    // 재시도 로직
    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 ${RETRY_DELAY / 1000}초 후 DB 초기화 재시도...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return initDB(retryCount + 1);
    } else {
      console.error(`❌ 최대 재시도 횟수(${MAX_RETRIES})를 초과했습니다. DB 초기화 실패.`);
      return false;
    }
  } finally {
    if (client) client.release();
  }
};

module.exports = initDB;