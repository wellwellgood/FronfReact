// ✅ 통합된 server.js - 전체 API + Socket.IO (채팅 포함)
require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const corsMiddleware = require("./middlewares/cors.js");
const initDB = require("./initDB.js");
const { testConnection } = require("./DB");

// 라우트 및 기능 모듈
const authRoutes = require("./routes/auth.js");
const uploadRoutes = require("./routes/uploadRouter.js");
const chatRoutes = require("./chatLog/logs.js");
const userRoutes = require("./routes/user.js");
const messageRoutes = require("./chatServer/routes/message.js");

// 소켓
const socket = require("./socket.js");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 10000;

// ✅ 미들웨어 설정
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 정적 파일 제공
app.use("/uploads", express.static(path.join(__dirname, "controllers/uploads")));

// ✅ 라우팅 설정
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chat", chatRoutes);
app.use("/uploads", express.static(path.join(__dirname, "controllers/uploads")));

// ✅ 서버 상태 확인
let dbConnected = false;
app.get("/", (req, res) => {
  res.json({
    status: "online",
    dbStatus: dbConnected ? "connected" : "disconnected",
    message: "서버 정상 작동 중입니다."
  });
});

app.get("/api/status/db", async (req, res) => {
  const isConnected = await testConnection();
  dbConnected = isConnected;
  res.json({
    dbStatus: isConnected ? "connected" : "disconnected",
    lastChecked: new Date().toISOString()
  });
});

// ✅ DB 미연결 시 대응 미들웨어
app.use(async (req, res, next) => {
  if (!dbConnected && (
    req.path.startsWith("/api/auth") ||
    req.path.startsWith("/api/messages") ||
    req.path.startsWith("/api/chat")
  )) {
    return res.status(503).json({
      status: "error",
      message: "데이터베이스 연결이 현재 불가능합니다. 잠시 후 다시 시도해주세요."
    });
  }
  next();
});

// ✅ 소켓.IO 서버 실행
socket(server);

// ✅ 서버 시작 함수
const startServer = async () => {
  server.listen(PORT, () => {
    console.log(`\u{1F680} 서버 실행 중: http://localhost:${PORT}`);

    testConnection().then(connected => {
      dbConnected = connected;
      if (connected) {
        console.log("✅ DB 연결 확인 완료");
        return initDB();
      } else {
        console.log("⚠️ DB 연결 실패, 재시도 예정");
        setInterval(async () => {
          const result = await testConnection();
          if (result && !dbConnected) {
            dbConnected = true;
            console.log("✅ DB 연결 복구됨");
            initDB();
          } else if (!result && dbConnected) {
            dbConnected = false;
            console.log("❌ DB 연결 끊어짐");
          }
        }, 10 * 60 * 1000);
      }
    });
  });
};

startServer();
