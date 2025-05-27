const { Server } = require('socket.io');
const pool = require('./DB'); // ✅ PostgreSQL용 Pool

module.exports = (server) => {
  const io = new Server(server, {
    cors: {
      origin:['http://localhost:4000',
      "https://myappboard.netlify.app"
    ],
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('📡 Client connected', socket.id);

    socket.on('message', async (msg) => {
      console.log('💬 message received:', msg);

      try {
        const client = await pool.connect();
        await client.query(
          'INSERT INTO messages (sender_username, receiver_username, sender_name, content, time) VALUES ($1, $2, $3, $4, $5)',
          [msg.sender_username, msg.receiver_username, msg.sender_name, msg.content, msg.time]
        );
        client.release();
      } catch (err) {
        console.error('❌ 메시지 저장 실패:', err);
      }

      io.emit('message', msg);
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected', socket.id);
    });

    socket.on('markAsRead', async ({ messageId, readBy }) => {
      // 데이터베이스에서 메시지 읽음 상태 업데이트
      await updateMessageReadStatus(messageId, readBy);
    });
    
    socket.on('messageRead', ({ messageId, readBy, to }) => {
      // 상대방에게 읽음 확인 전송
      socket.to(to).emit('messageRead', { messageId, readBy });
    });
  });
};
