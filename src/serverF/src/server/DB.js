const mariadb = require("mariadb");

const pool = mariadb.createPool({
  host: "localhost",
  user: "root",
  password: "3333",
  database: "chat", // 실제 DB 이름
  port: 3307,
  connectionLimit: 20,
});

module.exports = pool;
// ✅ 연결 테스트 (선택)
(async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log("✅ DB 연결 성공");
    const [rows] = await conn.query("SELECT DATABASE() AS db");
    console.log("📌 현재 DB:", rows[0].db);
  } catch (err) {
    console.error("❌ DB 연결 실패:", err);
  } finally {
    if (conn) conn.release();
  }
})();