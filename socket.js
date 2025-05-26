const { default: pool } = require("./DB.js");
const { Server } = require("socket.io");

module.exports = function (server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ 유저 소켓 연결됨");

    socket.on("message", async (msg) => {
      console.log("📩 받은 메시지:", msg);
      
      try {
          const client = await pool.connect();
          
          // time 컬럼 제거하고 DEFAULT 값 사용
          const result = await client.query(
              "INSERT INTO messages (sender_username, receiver_username, sender_name, content) VALUES ($1, $2, $3, $4) RETURNING *",
              [msg.sender_username, msg.receiver_username, msg.sender_name, msg.content]
          );
          
          console.log("💾 메시지 저장 완료:", result.rows[0]);
          client.release();
          
          // 저장된 메시지 정보를 다시 전송 (실제 DB의 시간 포함)
          io.emit("message", result.rows[0]);
      } catch (err) {
          console.error("❌ 메시지 저장 실패:", err.message);
          console.error("❌ 상세 에러:", err);
      }
    });
  });
};
