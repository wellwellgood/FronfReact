const mariadb = require("mariadb");
const dotenv = require('dotenv');
dotenv.config();

const pool = mariadb.createPool({
  host: process.env.MARIADB_HOST,
  port: Number(process.env.MARIADB_PORT),
  user: process.env.MARIADB_USER,
  password: process.env.MARIADB_PASSWORD,
  database: process.env.MARIADB_NAME,
  connectionLimit: 5,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;
