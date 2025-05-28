import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import styles from "./section2.module.css";
import Search from "../../search";
import { useNavigate } from "react-router-dom";
import { FaPaperclip } from "react-icons/fa";

const Section2 = () => {
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatBoxRef = useRef(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [userListError, setUserListError] = useState("");
  const [readMessages, setReadMessages] = useState(new Set()); // 읽은 메시지 ID 저장
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const API = "https://react-server-wmqa.onrender.com";

  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username");
    const storedName = sessionStorage.getItem("name");
    
    if (storedUsername && storedName) {
      console.log("✅ 로그인된 사용자:", storedUsername, storedName);
      setUsername(storedUsername);
      setName(storedName);
    } else {
      console.warn("❌ 세션 저장소에 username 또는 name 없음");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const newSocket = io(API, {
      transports  : ["websocket"],
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("🔌 소켓 연결됨");
    });

    // 새 메시지 수신
    newSocket.on("message", (msg) => {
      console.log("📨 새 메시지 수신:", msg);
      
      const safeMsg = {
        ...msg,
        time: msg.time || new Date().toISOString(),
        read: msg.read || false,
        id: msg.id || `temp_${Date.now()}`, // 임시 ID 생성 (서버에서 ID가 없을 경우)
      };

      setMessages((prev) => {
        // 중복 메시지 확인 (ID 기준 또는 내용+시간 기준)
        const isDuplicate = prev.some(
          (m) =>
            (m.id && safeMsg.id && m.id === safeMsg.id) ||
            (m.sender_username === safeMsg.sender_username &&
             m.receiver_username === safeMsg.receiver_username &&
             m.content === safeMsg.content &&
             Math.abs(new Date(m.time) - new Date(safeMsg.time)) < 1000) // 1초 이내 같은 메시지는 중복으로 처리
        );
        
        if (isDuplicate) {
          console.log("🔄 중복 메시지 무시:", safeMsg);
          return prev;
        }
        
        console.log("✅ 새 메시지 추가:", safeMsg);
        return [...prev, safeMsg];
      });
    });

    // 읽음 확인 수신
    newSocket.on("messageRead", ({ messageId, readBy }) => {
      console.log("📖 메시지 읽음 확인:", messageId, readBy);
      setReadMessages(prev => new Set([...prev, messageId]));
      
      // 메시지 목록에서 해당 메시지의 read 상태 업데이트
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      ));
    });

    newSocket.on("disconnect", () => {
      console.log("🔌 소켓 연결 해제됨");
    });

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (!username) {
      console.log("⏳ username이 없어서 API 호출 스킵");
      return;
    }

    console.log("📡 API 호출 시작 - username:", username);
    setIsLoading(true);
    setUserListError("");

    axios.get(`${API}/api/users`)
      .then((res) => {
        console.log("📋 유저 목록 응답:", res.data);
        const userList = Array.isArray(res.data) ? res.data : [];
        const filteredUsers = userList.filter((u) => u.username !== username);
        setUsers(filteredUsers);
        
        if (filteredUsers.length === 0) {
          setUserListError("다른 사용자가 없습니다.");
        }
      })
      .catch((err) => {
        console.error("❌ 유저 목록 가져오기 오류:", err.response?.data || err.message);
        setUserListError("유저 목록을 불러올 수 없습니다.");
      });

    axios.get(`${API}/api/messages`)
      .then((res) => {
        console.log("💬 메시지 목록 응답:", res.data);
        const data = res.data.map((msg) => ({
          ...msg,
          time: msg.time || new Date().toISOString(),
          read: msg.read || false, // 서버에서 읽음 상태 가져오기
        }));
        setMessages(data);
      })
      .catch((err) => {
        console.error("❌ 메시지 목록 오류:", err.response?.data || err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [username]);

  // 선택된 사용자가 변경될 때 해당 대화의 메시지들을 읽음 처리
  useEffect(() => {
    if (selectedUser && username && socket && socket.connected) {
      console.log("👀 채팅방 입장 - 읽음 처리 시작");
      
      // 현재 선택된 대화에서 내가 받은 메시지들을 읽음 처리
      const unreadMessages = messages.filter(msg => 
        msg.sender_username === selectedUser.username && 
        msg.receiver_username === username && 
        !msg.read &&
        msg.id
      );

      console.log("📖 읽음 처리할 메시지 수:", unreadMessages.length);

      unreadMessages.forEach(msg => {
        // 서버에 읽음 처리 알림
        socket.emit("markAsRead", {
          messageId: msg.id,
          readBy: username
        });

        // 상대방에게 읽음 확인 전송
        socket.emit("messageRead", {
          messageId: msg.id,
          readBy: username,
          to: selectedUser.username
        });

        console.log("📖 읽음 처리:", msg.id);
      });

      // 로컬 상태에서도 읽음 처리
      if (unreadMessages.length > 0) {
        setMessages(prev => prev.map(msg => 
          unreadMessages.some(unread => unread.id === msg.id) 
            ? { ...msg, read: true } 
            : msg
        ));
      }
    }
  }, [selectedUser, username, socket]);  // messages 의존성 제거로 무한 루프 방지

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo(0, chatBoxRef.current.scrollHeight);
    }
  }, [messages]);

  const handleSend = async () => {
    console.log("📨 handleSend 실행", { input, selectedUser, username, name });

    if (!input.trim() || !selectedUser || !username || !name) {
      console.warn("❌ 메시지 전송 조건 불충족");
      return;
    }

    const msg = {
      sender_username: username,
      receiver_username: selectedUser.username,
      sender_name: name,
      receiver_name: selectedUser.name, // 받는 사람 이름도 추가
      content: input.trim(),
      time: new Date().toISOString(),
      read: false,
    };

    console.log("📤 전송할 메시지 데이터:", msg);

    try {
      // 먼저 HTTP API로 데이터베이스에 저장
      const response = await axios.post(`${API}/api/messages`, msg);
      console.log("✅ 서버 응답:", response.data);
      
      const savedMessage = response.data;
      
      // 소켓으로 실시간 전송 (저장된 메시지 정보 포함)
      if (socket && socket.connected) {
        console.log("📡 소켓으로 메시지 전송:", savedMessage);
        socket.emit("message", savedMessage);
      } else {
        console.warn("⚠️ 소켓이 연결되지 않음");
      }
      
      setInput("");
      console.log("✅ 메시지 전송 완료");
    } catch (err) {
      console.error("❌ 메시지 전송 오류:", err.response?.data || err.message);
      alert(`메시지 전송에 실패했습니다: ${err.response?.data?.error || err.message}`);
    }

    if ((!input.trim() && !selectedFile) || !selectedUser || !username || !name) {
      return;
    }
  
    const formData = new FormData();
    formData.append("sender_username", username);
    formData.append("receiver_username", selectedUser.username);
    formData.append("sender_name", name);
    formData.append("receiver_name", selectedUser.name);
    formData.append("content", input.trim());
    formData.append("time", new Date().toISOString());
    formData.append("read", false);
    
    if (selectedFile) {
      formData.append("file", selectedFile);
    }
  
    try {
      const response = await axios.post(`${API}/api/messages`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
  
      const savedMessage = response.data;
  
      if (socket && socket.connected) {
        socket.emit("message", savedMessage);
      }
  
      setInput("");
      setSelectedFile(null);
    } catch (err) {
      console.error("❌ 메시지 전송 오류:", err.response?.data || err.message);
      alert(`메시지 전송 실패: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const fetchSearchData = () => {
    console.log("🔍 검색 데이터 가져오기");
  };

  const handleLogout = () => {
    console.log("🚪 로그아웃 처리");
    
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("name");
    
    if (socket) {
      socket.disconnect();
    }
    
    setUsername("");
    setName("");
    setUsers([]);
    setMessages([]);
    setSelectedUser(null);
    setReadMessages(new Set());
    
    navigate("/login");
  };

  // 메시지의 읽음 상태 확인 함수
  const getMessageReadStatus = (msg) => {
    const isMine = msg.sender_username === username;
    
    if (!isMine) return null; // 내가 보낸 메시지가 아니면 읽음 표시 안함
    
    // 메시지 ID가 있고, 읽음 목록에 있거나 메시지 자체에 read 속성이 true인 경우
    if (msg.id && (readMessages.has(msg.id) || msg.read)) {
      return "읽음";
    }
    
    return "안읽음";
  };

  return (
    <div className={styles.container}>
      <nav>
        <div className={styles.nav}>
          <div className={styles.logo1}>
            <h2>Logo</h2>
          </div>
          <ul className={styles.navmenu}>
            <li><button onClick={() => navigate("/main")}>Home</button></li>
            <li><button onClick={() => navigate("/ChatApp")}>Chat</button></li>
            <li><button onClick={() => navigate("/file")}>File</button></li>
            <li><button onClick={() => navigate("/sendEmail")}>Email</button></li>
          </ul>
        </div>
      </nav>

      <Search
        setTheme={setTheme}
        fetchSearchData={fetchSearchData}
        searchResults={searchResults}
        isLoading={isLoading}
        setSearchText={setSearchText}
        searchText={searchText}
        showResults={showResults}
        setShowResults={setShowResults}
        handleLogout={handleLogout}
      />

      <div className={styles.chatscreen}>
        <div className={styles.userList}>
          <h3>유저 목록</h3>
          
          {isLoading && <div className={styles.loading}>로딩 중...</div>}
          
          {userListError && (
            <div className={styles.error}>
              {userListError}
              <button onClick={() => window.location.reload()}>새로고침</button>
            </div>
          )}
          
          {!isLoading && !userListError && users.length === 0 && (
            <div className={styles.noUsers}>등록된 다른 사용자가 없습니다.</div>
          )}
          
          {users.map((user) => {
            // 각 유저와의 안읽은 메시지 수 계산
            const unreadCount = messages.filter(msg => 
              msg.sender_username === user.username && 
              msg.receiver_username === username && 
              !msg.read
            ).length;
  
            return (
              <div
                key={user.username}
                className={`${styles.userItem} ${selectedUser?.username === user.username ? styles.selected : ""}`}
                onClick={() => {
                  console.log("✅ 선택된 유저:", user);
                  setSelectedUser(user);
                }}
              >
                <div className={styles.userInfo}>
                  <span>{user.name} ({user.username})</span>
                  {unreadCount > 0 && (
                    <span className={styles.unreadBadge}>{unreadCount}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
  
        <div className={styles.chatBox}>
          <div className={styles.chatHeaderContainer}>
            <div className={styles.chatHeader}>
              {selectedUser ? `${selectedUser.name}님과 채팅중` : "채팅할 유저를 선택하세요"}
            </div>
          
            <div className={styles.messages} ref={chatBoxRef}>
              {messages
                .filter(
                  (msg) =>
                    selectedUser && (
                      (msg.sender_username === username && msg.receiver_username === selectedUser.username) ||
                      (msg.receiver_username === username && msg.sender_username === selectedUser.username)
                    )
                )
                .map((msg, index) => {
                  const isMine = msg.sender_username === username;
                  const readStatus = getMessageReadStatus(msg);

                  return (
                    <div key={index} className={isMine ? styles.myMessage : styles.theirMessage}>
                      {!isMine && <div className={styles.profileIcon}>{msg.sender_name?.[0] || "?"}</div>}
                      <div className={styles.bubbleWrapper}>
                        <div className={styles.messageBubble}>
                          <div className={styles.messageText}>{msg.content}</div>
                          <div className={styles.messageMeta}>
                            <span className={styles.time}>
                              {msg.time
                                ? new Date(msg.time).toLocaleTimeString("ko-KR", {
                                    year:"2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                            {isMine && readStatus && (
                              <span className={`${styles.readMark} ${readStatus === '읽음' ? styles.read : styles.unread}`}>
                                {readStatus}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isMine && <div className={styles.profileIcon}>{name?.[0] || "?"}</div>}
                    </div>
                  );
                })}
            </div>
          </div>
  
          
          <div className={styles.inputBox}>
            <button
              type="button"
              className={styles.fileButton}
              onClick={() => fileInputRef.current.click()}
              title="파일 첨부"
            >
              <FaPaperclip size={20} />
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => setSelectedFile(e.target.files[0])}
              style={{ display: "none" }}
            />

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요"
            />

            <button 
              className={styles.submit} 
              onClick={handleSend} 
              disabled={(!input.trim() && !selectedFile) || !selectedUser}
            >
              전송
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Section2;