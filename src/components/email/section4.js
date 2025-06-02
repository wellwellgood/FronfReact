import React, { useRef, useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import styles from "./AA/email.js/SendEmail.module.css";
import Search from "../../search";
import { useNavigate } from "react-router-dom";

const Section4 = () => {
  const navigate = useNavigate();
  const form = useRef();
  const fileInputRef = useRef(null);

  const [agree, setAgree] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agree) {
      alert("개인정보 수집 및 이용에 동의해주세요.");
      return;
    }

    emailjs
      .sendForm(
        "YOUR_SERVICE_ID",
        "YOUR_TEMPLATE_ID",
        form.current,
        "YOUR_PUBLIC_KEY"
      )
      .then(
        () => {
          alert("이메일이 성공적으로 전송되었습니다.");
          form.current.reset();
          setAgree(false);
          setSelectedFiles([]); // 파일 초기화
        },
        (error) => {
          alert("이메일 전송에 실패했습니다. 다시 시도해주세요.");
          console.error("EmailJS Error:", error);
        }
      );
  };

  const fetchSearchData = () => {
    console.log("🔍 검색 데이터 가져오기");
  };

  const handleLogout = () => {
    console.log("🚪 로그아웃 처리");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("name");

    navigate("/login");
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      console.log("파일 선택됨:", files.map((f) => f.name).join(", "));
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

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

      <form ref={form} onSubmit={handleSubmit} className={styles.mailform}>
        <div className={styles.inputGroup}>
          <label htmlFor="user_send_name">보낸 사람 이메일</label>
          <input
            id="user_send_name"
            name="user_send_name"
            type="email"
            placeholder="이메일 주소"
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="user_accept_email">받는 사람 이메일</label>
          <input
              id="user_accept_email"
              name="user_accept_email"
              type="text"
              placeholder="이메일 주소"
              required
            />
        </div>
        
        <div className={styles.inputGroup}>
          <label htmlFor="subject">제목</label>
          <input
            id="subject"
            name="subject"
            type="text"
            placeholder="제목"
            required
          >
          </input>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="File_upload">파일첨부</label>
          <button
            type="button"
            className={styles.fileButton}
            onClick={() => fileInputRef.current.click()}
            title="파일 첨부"
          >
            {selectedFiles.length === 0 && (
              <span className={styles.fileText}>
                <span className={styles.PC}>내 PC</span>의 <span className={styles.PC}>&nbsp;파일</span>&nbsp;을 선택해주세요.
              </span>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: "none" }}
              multiple
            />
            {selectedFiles.length > 0 && (
              <div className={styles.selectedFileList}>
                {selectedFiles.map((file, index) => (
                  <div key={index} className={styles.selectedFile}>
                    {file.name}
                    <button
                      type="button"
                      className={styles.closeButton}
                      onClick={() => handleRemoveFile(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </button>
        </div>

        <div className={styles.privacyBox}>
          <p className={styles.privacyText}>
            본인은 개인정보 보호법 제15조에 따라 본인의 이메일 정보를 제공하는 것에 동의합니다.
          </p>
          <label className={styles.checkboxLine}>
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              required
            />
            <span>개인정보 수집 및 이용에 동의합니다. (필수)</span>
          </label>
        </div>

        <div className={styles.textAreaBox}>
          <input
            name="message"
            placeholder="내용을 입력하세요"
            className={styles.textArea}
            required
          ></input>
          <button 
          type="submit"
          className={styles.submitButton}
          >
          전송
        </button>
        </div>
      </form>
    </div>
  );
};

export default Section4;
