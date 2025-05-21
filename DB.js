// DB.js
const { Pool } = require('pg');
require('dotenv').config();

// Railway의 MySQL 환경 변수를 사용
const pool = mariadb.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'mysql.railway.internal',
  port: process.env.MYSQLPORT || process.env.DB_PORT || '3306',
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'railway',
  connectionLimit: 5,
  connectTimeout: 30000,        // 연결 타임아웃 증가 (30초)
  acquireTimeout: 30000,        // 획득 타임아웃 증가 (30초)
  idleTimeout: 60000,           // 유휴 연결 타임아웃 (60초)
});

// 데이터베이스 연결 확인 함수
async function testConnection() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('✅ 데이터베이스 연결 성공!');
    console.log(`- 호스트: ${process.env.MYSQLHOST || process.env.DB_HOST || 'mysql.railway.internal'}`);
    console.log(`- 데이터베이스: ${process.env.MYSQLDATABASE || process.env.DB_NAME || 'railway'}`);
    return true;
  } catch (err) {
    console.error('❌ 데이터베이스 연결 실패:', err.message);
    console.error('- 연결 설정 정보:');
    console.error(`  호스트: ${process.env.MYSQLHOST || process.env.DB_HOST || 'mysql.railway.internal'}`);
    console.error(`  포트: ${process.env.MYSQLPORT || process.env.DB_PORT || '3306'}`);
    console.error(`  사용자: ${process.env.MYSQLUSER || process.env.DB_USER || 'root'}`);
    console.error(`  데이터베이스: ${process.env.MYSQLDATABASE || process.env.DB_NAME || 'railway'}`);
    return false;
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {
  pool,
  testConnection
};