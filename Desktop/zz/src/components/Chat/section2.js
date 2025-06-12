import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import styles from "./section2.module.css";
import Search from "../../search";
import { useNavigate } from "react-router-dom";
import { FaPaperclip } from "react-icons/fa";
import { flushSync } from "react-dom";

const Section2 = () => {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [readMessages, setReadMessages] = useState(new Set());
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [searchResults, setSearchResults] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userListError, setUserListError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const chatBoxRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showResults, setShowResults] = useState(false);
  const API = "https://react-server-wmqa.onrender.com";

  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username");
    const storedName = sessionStorage.getItem("name");
    if (storedUsername && storedName) {
      setUsername(storedUsername);
      setName(storedName);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!username) return;
    const newSocket = io(API, { transports: ["websocket"] });
    setSocket(newSocket);

    newSocket.on("message", (msg) => {
      if (msg.sender_username === username) return;
      const safeMsg = {
        ...msg,
        content: msg.content || '',
        time: msg.time || new Date().toISOString(),
        read: msg.read || false,
        id: msg.id || `socket_${Date.now()}`,
      };
      setMessages((prev) => {
        const isDuplicate = prev.some((m) =>
          (m.id && safeMsg.id && m.id === safeMsg.id) ||
          (m.sender_username === safeMsg.sender_username &&
            m.receiver_username === safeMsg.receiver_username &&
            m.content === safeMsg.content &&
            Math.abs(new Date(m.time) - new Date(safeMsg.time)) < 2000)
        );
        return isDuplicate ? prev : [...prev, safeMsg];
      });
    });

    newSocket.on("messageRead", ({ messageId }) => {
      setReadMessages((prev) => new Set([...prev, messageId]));
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, read: true, isTemporary: false } : msg
        )
      );
    });

    return () => newSocket.disconnect();
  }, [username]);

  useEffect(() => {
    if (!username) return;
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API}/api/users`);
        const list = res.data.users || res.data.data || res.data || [];
        setUsers(list.filter((u) => u.username !== username));
      } catch {
        setUserListError("유저 목록을 불러올 수 없습니다.");
      }
    };

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${API}/api/messages`);
        const data = res.data.messages || res.data.data || res.data || [];
        setMessages(data);
      } catch {
        setMessages([]);
      }
    };

    const loadData = async () => {
      setIsLoading(true);
      await fetchUsers();
      await fetchMessages();
      setIsLoading(false);
    };

    loadData();
  }, [username]);

  const getMessageReadStatus = (msg) =>
    msg.sender_username === username && (msg.read || readMessages.has(msg.id)) ? "읽음" : "안읽음";

  const getFilteredMessages = () =>
    selectedUser
      ? messages.filter(
          (msg) =>
            (msg.sender_username === username && msg.receiver_username === selectedUser.username) ||
            (msg.receiver_username === username && msg.sender_username === selectedUser.username)
        )
      : [];

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || !selectedUser) return;
    const tempId = `temp_${Date.now()}`;
    const now = new Date().toISOString();
    const tempMessage = {
      id: tempId,
      sender_username: username,
      receiver_username: selectedUser.username,
      receiver_name: selectedUser.name,
      content: input.trim(),
      read: false,
      time: now,
      isTemporary: true,
    };

    flushSync(() => setMessages((prev) => [...prev, tempMessage]));
    setInput("");

    setTimeout(() => {
      chatBoxRef.current && (chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight);
    }, 0);

    try {
      let res;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("sender_username", username);
        formData.append("receiver_username", selectedUser.username);
        formData.append("receiver_name", selectedUser.name);
        formData.append("content", input.trim());
        formData.append("read", false);
        formData.append("file", selectedFile);
        res = await axios.post(`${API}/api/messages`, formData);
        setSelectedFile(null);
      } else {
        res = await axios.post(`${API}/api/messages`, {
          sender_username: username,
          receiver_username: selectedUser.username,
          receiver_name: selectedUser.name,
          content: input.trim(),
          read: false,
        });
      }
      const saved = res.data;
      setMessages((prev) => prev.map((msg) => (msg.id === tempId ? saved : msg)));
    } catch {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...msg, content: "(전송 실패)", failed: true } : msg))
      );
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    socket?.disconnect();
    navigate("/login");
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    file && setSelectedFile(file);
  };
  const fetchSearchData = () => {};

  return (
    <div className={styles.container}>
      {/* 네비게이션 바 */}
      <nav>
        <div className={styles.nav}>
          <div className={styles.logo1}>
            <h2>Logo</h2>
          </div>
          <ul className={styles.navmenu}>
            <li><button onClick={() => handleNavigation("/main")}>Home</button></li>
            <li><button onClick={() => handleNavigation("/ChatApp")}>Chat</button></li>
            <li><button onClick={() => handleNavigation("/file")}>File</button></li>
            <li><button onClick={() => handleNavigation("/sendEmail")}>Email</button></li>
          </ul>
        </div>
      </nav>

      {/* 검색 컴포넌트 */}
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

      {/* 메인 채팅 화면 */}
      <div className={styles.chatscreen}>
        {/* 사용자 목록 */}
        <div className={styles.userList}>
          <h3>유저 목록 {users.length > 0 && `(${users.length}명)`}</h3>
          
          {isLoading && <div className={styles.loading}>로딩 중...</div>}
          
          {userListError && (
            <div className={styles.error}>
              <div>{userListError}</div>
              <button 
                onClick={() => window.location.reload()}
                style={{ marginTop: '5px', padding: '5px 10px' }}
              >
                새로고침
              </button>
              <button 
                onClick={() => {
                  setUserListError("");
                  setIsLoading(true);
                  // 수동으로 다시 로드
                  window.location.reload();
                }}
                style={{ marginTop: '5px', marginLeft: '5px', padding: '5px 10px' }}
              >
                다시 시도
              </button>
            </div>
          )}
          
          {!isLoading && !userListError && users.length === 0 && (
            <div className={styles.noUsers}>
              <div>등록된 다른 사용자가 없습니다.</div>
              <button 
                onClick={() => {
                  console.log("🔄 수동 새로고침 시도");
                  window.location.reload();
                }}
                style={{ marginTop: '10px', padding: '5px 10px', fontSize: '12px' }}
              >
                새로고침
              </button>
            </div>
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

        {/* 채팅 박스 */}
        <div className={styles.chatBox}>
          <div className={styles.chatHeaderContainer}>
            <div className={styles.chatHeader}>
              {selectedUser ? `${selectedUser.name}님과 채팅중...` : "채팅할 유저를 선택하세요"}
            </div>
          
            {/* 메시지 표시 영역 */}
            <div className={styles.messages} ref={chatBoxRef}>
              {(() => {
                const filteredMessages = getFilteredMessages();

                return filteredMessages.map((msg, index) => {
                  const isMine = msg.sender_username === username;
                  const readStatus = getMessageReadStatus(msg);
                  const displayFileName =
                  msg.file_name || msg.file?.name || msg.fileUrl?.split("/").pop() || "파일";


                  return (
                    <div 
                      key={msg.id || index} 
                      className={isMine ? styles.myMessage : styles.theirMessage}
                    >
                      {!isMine && (
                        <div className={styles.profileIcon}>
                        </div>
                      )}
                      <div className={styles.bubbleWrapper}>
                        <div className={styles.messageBubble}>
                          <div className={styles.messageText}>
                            {msg.content || '내용 없음'}
                            {(msg.fileUrl || msg.file) && (
                            <div className={styles.filePreview}>
                              <a href={msg.fileUrl} download target="_blank" rel="noopener noreferrer">
                              {displayFileName}
                            </a>
                            </div>
                          )}
                          </div>
                          <div className={styles.messageMeta}>
                            <span className={styles.time}>
                              {msg.time
                                ? new Date(msg.time).toLocaleTimeString("ko-KR", {
                                    year: "2-digit",
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
                      {isMine && (
                        <div className={styles.profileIcon}>
                          {name?.[0] || "?"}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* 메시지 입력 영역 */}
          <div className={styles.inputBox}>
            <button
              type="button"
              className={styles.fileButton}
              onClick={() => fileInputRef.current?.click()}
              title="파일 첨부"
            >
              <FaPaperclip size={20} />
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />

            {selectedFile && (
              <div className={styles.selectedFile}>
                📎 {selectedFile.name}
                <button onClick={() => setSelectedFile(null)}>×</button>
              </div>
            )}

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