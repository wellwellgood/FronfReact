import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import styles from "./section2.module.css";
import Search from "../../search";
import { useNavigate } from "react-router-dom";

const Section2 = () => {
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatBoxRef = useRef(null);
  const [theme, setTheme] = useState(() => {
    // 초기 테마를 localStorage에서 불러오기
    return localStorage.getItem("theme") || "light";
  });
  const [searchResults, setSearchResults] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [userListError, setUserListError] = useState("");
  const navigate = useNavigate();

  const API = "https://react-server-wmqa.onrender.com";

  // 초기 사용자 정보 로드 및 검증
  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username");
    const storedName = sessionStorage.getItem("name");
    
    if (storedUsername && storedName) {
      console.log("✅ 로그인된 사용자:", storedUsername, storedName);
      setUsername(storedUsername);
      setName(storedName);
    } else {
      console.warn("❌ 세션 저장소에 username 또는 name 없음");
      // 로그인 정보가 없으면 로그인 페이지로 리다이렉트
      navigate("/login");
    }
  }, [navigate]);

  // 테마 설정 초기화 및 변경 처리
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // 소켓 연결 및 메시지 수신 처리
  useEffect(() => {
    const newSocket = io(API);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("🔌 소켓 연결됨");
    });

    newSocket.on("message", (msg) => {
      const safeMsg = {
        ...msg,
        time: msg.time || new Date().toISOString(),
      };

      setMessages((prev) => {
        const isDuplicate = prev.some(
          (m) =>
            m.sender_username === safeMsg.sender_username &&
            m.receiver_username === safeMsg.receiver_username &&
            m.content === safeMsg.content &&
            m.time === safeMsg.time
        );
        return isDuplicate ? prev : [...prev, safeMsg];
      });
    });

    newSocket.on("disconnect", () => {
      console.log("🔌 소켓 연결 해제됨");
    });

    return () => newSocket.disconnect();
  }, []);

  // 유저 목록 및 메시지 불러오기
  useEffect(() => {
    if (!username) {
      console.log("⏳ username이 없어서 API 호출 스킵");
      return;
    }

    console.log("📡 API 호출 시작 - username:", username);
    setIsLoading(true);
    setUserListError("");

    // 유저 목록 가져오기
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

    // 메시지 목록 가져오기
    axios.get(`${API}/api/messages`)
      .then((res) => {
        console.log("💬 메시지 목록 응답:", res.data);
        const data = res.data.map((msg) => ({
          ...msg,
          time: msg.time || new Date().toISOString(),
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

  // 채팅창 스크롤 자동 이동
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo(0, chatBoxRef.current.scrollHeight);
    }
  }, [messages]);

  // 메시지 전송 처리
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
      content: input.trim(),
      time: new Date().toISOString(),
    };

    try {
      await axios.post(`${API}/api/messages`, msg);
      if (socket) {
        socket.emit("message", msg);
      }
      setInput("");
      console.log("✅ 메시지 전송 완료");
    } catch (err) {
      console.error("❌ 메시지 전송 오류:", err.response?.data || err.message);
      alert("메시지 전송에 실패했습니다.");
    }
  };

  // Enter 키로 메시지 전송
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 검색 데이터 가져오기 (구현 필요시)
  const fetchSearchData = () => {
    console.log("🔍 검색 데이터 가져오기");
    // 필요에 따라 구현
  };

  // 로그아웃 처리
  const handleLogout = () => {
    console.log("🚪 로그아웃 처리");
    
    // 세션 스토리지 클리어
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("name");
    
    // 소켓 연결 해제
    if (socket) {
      socket.disconnect();
    }
    
    // 상태 초기화
    setUsername("");
    setName("");
    setUsers([]);
    setMessages([]);
    setSelectedUser(null);
    
    // 로그인 페이지로 리다이렉트
    navigate("/login");
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
        
        {users.map((user) => (
          <div
            key={user.username}
            className={`${styles.userItem} ${selectedUser?.username === user.username ? styles.selected : ""}`}
            onClick={() => {
              console.log("✅ 선택된 유저:", user);
              setSelectedUser(user);
            }}
          >
            {user.name} ({user.username})
          </div>
        ))}
      </div>

      <div className={styles.chatBox}>
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
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                        {isMine && <span className={styles.readMark}>읽음</span>}
                      </div>
                    </div>
                  </div>
                  {isMine && <div className={styles.profileIcon}>{name?.[0] || "?"}</div>}
                </div>
              );
            })}
        </div>

        <div className={styles.inputBox}>
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
            disabled={!input.trim() || !selectedUser}
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
};

export default Section2;