// server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const corsMiddleware = require("./middlewares/cors.js");
const authRoutes = require("./routes/auth.js");
const messageRoutes = require("./routes/message.js");
const uploadRoutes = require("./routes/uploadRouter.js");
const chatRoutes = require("./chatLog/logs.js"); // (채팅 로그용 API)
const sendCodeRoute = require("./coolSMS.js");
const socket = require("./socket.js"); // 소켓 파일 불러오기
const initDB = require("./initDB");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// ✅ 미들웨어
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ API 라우트 연결
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/chat", chatRoutes); // (채팅 로그 API)
app.use("/api/send-code", sendCodeRoute);

// ✅ 서버 상태 확인
app.get("/", (req, res) => {
  res.send("서버 정상 작동 중입니다.");
});

// ✅ 소켓 서버 연결
socket(server);

// ✅ 서버 시작
app.listen(PORT, async () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
  await initDB(); // 🚨 여기서 DB 테이블 자동 생성
});
