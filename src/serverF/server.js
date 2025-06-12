// server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const corsMiddleware = require("./middlewares/cors.js");
const initDB = require("./initDB.js");
const { testConnection } = require("./DB"); // DB 테스트 함수 가져오기

const authRoutes = require("./routes/auth.js");
const messageRoutes = require("./routes/message.js");
const uploadRoutes = require("./routes/uploadRouter.js");
const chatRoutes = require("./chatLog/logs.js");
const socket = require("./socket.js");
const userRoutes = require("./routes/user.js");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 10000;

// 미들웨어
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/users", userRoutes);

// DB 연결이 실패할 경우 대체 응답을 제공하는 미들웨어
let dbConnected = false;
app.use(async (req, res, next) => {
  // DB 연결이 필요한 경로만 확인
  if (!dbConnected && (
    req.path.startsWith('/api/auth') || 
    req.path.startsWith('/api/messages') || 
    req.path.startsWith('/api/chat')
  )) {
    return res.status(503).json({
      status: 'error',
      message: '데이터베이스 연결이 현재 불가능합니다. 잠시 후 다시 시도해주세요.'
    });
  }
  next();
});

// API 라우트
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/chat", chatRoutes);

// 서버 상태 확인용
app.get("/", (req, res) => {
  res.json({
    status: "online",
    dbStatus: dbConnected ? "connected" : "disconnected",
    message: "서버 정상 작동 중입니다."
  });
});

// DB 상태 전용 엔드포인트
app.get("/api/status/db", async (req, res) => {
  const isConnected = await testConnection();
  dbConnected = isConnected;
  
  res.json({
    dbStatus: isConnected ? "connected" : "disconnected",
    lastChecked: new Date().toISOString()
  });
});

// 소켓 서버 연결
socket(server);

// 서버 시작
const startServer = async () => {
  // 서버 시작
  server.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
    
    // DB 연결 테스트 및 초기화
    testConnection()
      .then(connected => {
        dbConnected = connected;
        if (connected) {
          console.log('✅ DB 연결 확인 완료');
          return initDB();
        } else {
          console.log('⚠️ DB 연결이 실패했지만 서버는 계속 실행됩니다.');
          console.log('⏱️ 주기적으로 DB 연결을 재시도합니다.');
          
          // 주기적인 DB 연결 재시도 (10분 간격)
          setInterval(async () => {
            const result = await testConnection();
            if (result && !dbConnected) {
              dbConnected = true;
              console.log('✅ DB 연결 복구됨');
              initDB();
            } else if (!result && dbConnected) {
              dbConnected = false;
              console.log('❌ DB 연결이 끊어짐');
            }
          }, 10 * 60 * 1000); // 10분마다
        }
      });
  });
};

// 서버 시작
startServer();
