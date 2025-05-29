import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import styles from "./section2.module.css";
import Search from "../../search";
import { useNavigate } from "react-router-dom";
import { FaPaperclip } from "react-icons/fa";
import { flushSync } from "react-dom";

const Section2 = () => {
  // Socket 관련 상태
  const [socket, setSocket] = useState(null);
  
  // 사용자 관련 상태
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  
  // 메시지 관련 상태
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [readMessages, setReadMessages] = useState(new Set());
  const tempId = `temp_${Date.now()}`;
  const now = new Date().toISOString();
  
  // UI 관련 상태
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [searchResults, setSearchResults] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userListError, setUserListError] = useState("");
  
  // 파일 관련 상태
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Refs
  const chatBoxRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const API = "https://react-server-wmqa.onrender.com";

  // 초기 사용자 인증 확인
  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username");
    const storedName = sessionStorage.getItem("name");
    
    if (storedUsername && storedName) {
      setUsername(storedUsername);
      setName(storedName);
    } else {
      console.warn("❌ 세션 저장소에 username 또는 name 없음");
      navigate("/login");
    }
  }, [navigate]);

  // 테마 설정
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // 소켓 연결 및 이벤트 리스너 설정
  useEffect(() => {
    if (!username) return;

    const newSocket = io(API, {
      transports: ["websocket"],
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
    });

    // 새 메시지 수신 (다른 사용자로부터)
    newSocket.on("message", (msg) => {
      
      if (!msg) {
        console.warn("⚠️ 수신된 메시지가 null입니다.");
        return;
      }
      
      // 내가 보낸 메시지는 이미 handleSend에서 처리했으므로 무시
      if (msg.sender_username === username) {
        return;
      }
      
      const safeMsg = {
        ...msg,
        content: msg.content || '',
        time: msg.time || new Date().toISOString(),
        read: msg.read || false,
        id: msg.id || `socket_${Date.now()}`,
      };

      console.log("✅ 다른 사용자 메시지 추가:", safeMsg);
      
      setMessages((prev) => {
        // 중복 확인
        const isDuplicate = prev.some((m) =>
          (m.id && safeMsg.id && m.id === safeMsg.id) ||
          (m.sender_username === safeMsg.sender_username &&
           m.receiver_username === safeMsg.receiver_username &&
           m.content === safeMsg.content &&
           Math.abs(new Date(m.time) - new Date(safeMsg.time)) < 2000)
        );
        
        if (isDuplicate) {
          console.log("🔄 중복 메시지 무시");
          return prev;
        }
        
        return [...prev, safeMsg];
      });
    });

    // 읽음 확인 수신
    newSocket.on("messageRead", ({ messageId, readBy }) => {
      console.log("📖 메시지 읽음 확인:", messageId, readBy);
      setReadMessages(prev => new Set([...prev, messageId]));
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? { ...savedMessage, isTemporary: false }
            : msg
        )
      );
    });

    newSocket.on("disconnect", () => {
    });

    return () => newSocket.disconnect();
  }, [username]);

  // 사용자 목록 및 메시지 로드
  useEffect(() => {
    if (!username) {
      return;
    }

    setIsLoading(true);
    setUserListError("");

    // 유저 목록 가져오기
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API}/api/users`, {
          timeout: 10000, // 10초 타임아웃
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.status === 200) {
          let userList = [];
          
          // 응답 데이터 형식 확인 및 처리
          if (Array.isArray(response.data)) {
            userList = response.data;
          } else if (response.data && Array.isArray(response.data.users)) {
            userList = response.data.users;
          } else if (response.data && Array.isArray(response.data.data)) {
            userList = response.data.data;
          } else {
            console.warn("⚠️ 예상치 못한 응답 형식:", response.data);
            userList = [];
          }
          
          
          const filteredUsers = userList.filter((u) => u && u.username && u.username !== username);
          
          setUsers(filteredUsers);
          
          if (filteredUsers.length === 0) {
            setUserListError("다른 사용자가 없습니다.");
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        console.error("❌ 유저 목록 가져오기 상세 오류:", {
          message: err.message,
          response: err.response,
          status: err.response?.status,
          data: err.response?.data,
          config: err.config
        });
        
        let errorMessage = "유저 목록을 불러올 수 없습니다.";
        
        if (err.code === 'ECONNABORTED') {
          errorMessage = "서버 응답 시간 초과 (네트워크 확인 필요)";
        } else if (err.response?.status === 404) {
          errorMessage = "API 엔드포인트를 찾을 수 없습니다.";
        } else if (err.response?.status === 500) {
          errorMessage = "서버 내부 오류가 발생했습니다.";
        } else if (err.message.includes('Network Error')) {
          errorMessage = "네트워크 연결을 확인해주세요.";
        }
        
        setUserListError(errorMessage);
        setUsers([]);
      }
    };

    // 메시지 목록 가져오기
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`${API}/api/messages`, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        
        let messageList = [];
        if (Array.isArray(response.data)) {
          messageList = response.data;
        } else if (response.data && Array.isArray(response.data.messages)) {
          messageList = response.data.messages;
        } else if (response.data && Array.isArray(response.data.data)) {
          messageList = response.data.data;
        }
        
        const processedMessages = messageList.map((msg) => ({
          ...msg,
          content: msg.content || '',
          time: msg.time || new Date().toISOString(),
          read: msg.read || false,
        }));
        
        setMessages(processedMessages);
      } catch (err) {
        // 메시지 로드 실패는 심각하지 않으므로 빈 배열로 설정
        setMessages([]);
      }
    };

    // 순차적으로 실행
    const loadData = async () => {
      await fetchUsers();
      await fetchMessages();
      setIsLoading(false);
    };

    loadData();
  }, [username]);

  // 메시지 읽음 상태 확인 함수
  const getMessageReadStatus = (msg) => {
    if (!msg || msg.sender_username !== username) {
      return null; // 내가 보낸 메시지가 아니면 읽음 상태 표시 안함
    }
    
    // 읽음 상태 확인
    if (msg.read || readMessages.has(msg.id)) {
      return '읽음';
    }
    
    return '안읽음';
  };

  // 필터링된 메시지 가져오기
  const getFilteredMessages = () => {
    if (!selectedUser) {
      return [];
    }

    return messages.filter((msg) => {
      const isMyMessage = msg.sender_username === username && msg.receiver_username === selectedUser.username;
      const isTheirMessage = msg.receiver_username === username && msg.sender_username === selectedUser.username;
      return isMyMessage || isTheirMessage;
    });
  };

  // 메시지 전송 처리
  const handleSend = async () => {
  
    if ((!input.trim() && !selectedFile) || !selectedUser || !username || !name) {
      console.warn("❌ 메시지 전송 조건 불충족");
      return;
    }
  
    const tempId = `temp_${Date.now()}`;
    const now = new Date().toISOString();
  
    const tempMessage = {
      id: tempId,
      sender_username: username,
      receiver_username: selectedUser.username,
      sender_name: name,
      receiver_name: selectedUser.name,
      content: input.trim(),
      read: false,
      time: now,
      isTemporary: true,
    };
  
    // ✅ 즉시 채팅창에 표시
    flushSync(() => {
      setMessages((prev) => [...prev, tempMessage]);
    });
    setInput("");
    
    // ✅ 스크롤 보장
    setTimeout(() => {
      if (chatBoxRef.current) {
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }
    }, 0);
  
    try {
      let response;
  
      if (selectedFile) {
        const formData = new FormData();
        formData.append("sender_username", username);
        formData.append("receiver_username", selectedUser.username);
        formData.append("sender_name", name);
        formData.append("receiver_name", selectedUser.name);
        formData.append("content", input.trim());
        formData.append("read", false);
        formData.append("file", selectedFile);
  
        response = await axios.post(`${API}/api/messages`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
  
        setSelectedFile(null);
      } else {
        response = await axios.post(`${API}/api/messages`, {
          sender_username: username,
          receiver_username: selectedUser.username,
          sender_name: name,
          receiver_name: selectedUser.name,
          content: input.trim(),
          read: false,
        });
      }
  
      const savedMessage = response.data;
  
      // ✅ 임시 메시지를 실제 메시지로 교체
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? savedMessage : msg))
      );
  
      // ✅ 소켓 브로드캐스트
      if (socket && socket.connected) {
        socket.emit("message", savedMessage);
      }
    } catch (err) {
      console.error("❌ 메시지 전송 실패:", err.response?.data || err.message);
      alert("메시지 전송 실패");
  
      // ❗ 실패한 임시 메시지 제거 또는 회색 처리 유지
      setMessages((prev) => prev.map((msg) =>
        msg.id === tempId ? { ...msg, content: "(전송 실패)", failed: true } : msg
      ));
    }
  };
  

  // 키보드 이벤트 처리
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 검색 데이터 가져오기
  const fetchSearchData = () => {
    console.log("🔍 검색 데이터 가져오기");
  };

  // 로그아웃 처리
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

  // 파일 선택 처리
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      console.log("📎 파일 선택됨:", file.name);
    }
  };

  return (
    <div className={styles.container}>
      {/* 네비게이션 바 */}
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
              {selectedUser ? `${selectedUser.name}님과 채팅중` : "채팅할 유저를 선택하세요"}
            </div>
          
            {/* 메시지 표시 영역 */}
            <div className={styles.messages} ref={chatBoxRef}>
              {(() => {
                const filteredMessages = getFilteredMessages();

                
                return filteredMessages.map((msg, index) => {
                  const isMine = msg.sender_username === username;
                  const readStatus = getMessageReadStatus(msg);

                  return (
                    <div 
                      key={msg.id || index} 
                      className={isMine ? styles.myMessage : styles.theirMessage}
                    >
                      {!isMine && (
                        <div className={styles.profileIcon}>
                          {msg.sender_name?.[0] || "?"}
                        </div>
                      )}
                      <div className={styles.bubbleWrapper}>
                        <div className={styles.messageBubble}>
                          <div className={styles.messageText}>
                            {msg.content || '내용 없음'}
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
              onClick={() => fileInputRef.current.click()}
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