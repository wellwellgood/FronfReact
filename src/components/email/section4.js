import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import emailjs from "@emailjs/browser";
import styles from "./AA/email.js/SendEmail.module.css";
import Search from "../../search";
export default function Section4SendEmail() {
  const navigate = useNavigate();
  const form = useRef();
  const [text, setText] = useState("");
  const [agree, setAgree] = useState(false);
  const [theme, setTheme] = useState("light");
  const [searchResults, setSearchResults] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fetchSearchData = () => {};
  const handleLogout = () => {};
  
  
  const handleSearchChange = (e) => setText(e.target.value);

  const handleCheckboxChange = (e) => {
    setAgree(e.target.checked);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agree) {
      alert("개인정보 수집 및 이용에 동의해주세요.");
      return;
    }

    emailjs
      .sendForm(
        "service_a9udeim", // 자신의 emailjs 서비스 ID
        "template_3nu35ld", // 자신의 emailjs 템플릿 ID
        form.current,
        "s9Hb7DTTLBcp34TPu" // 자신의 emailjs 사용자 키
      )
      .then(
        (result) => {
          console.log(result.text);
          alert("이메일이 성공적으로 전송되었습니다!");
          navigate("/main");
        },
        (error) => {
          console.error(error.text);
          alert("이메일 전송 중 오류 발생");
        }
      );
  };

  return (
    <div className={styles.body}>
      <nav>
        <div className={styles.nav}>
          <div className={styles.logo1}>
            <h2>Logo</h2>
            <span></span>
          </div>
          <ul className={styles.navmenu}>
            <li className={styles.homebtn}><button className={styles.button} onClick={() => navigate("/main")}>Home</button></li>
            <li className={styles.infobtn}><button className={styles.button} onClick={() => navigate("/ChatApp")}>Chat</button></li>
            <li className={styles.filebtn}><button className={styles.button} onClick={() => navigate("/file")}>File</button></li>
            <li className={styles.emailbtn}><button onClick={() => navigate("/sendEmail")}>Email</button></li>
          </ul>
          {/* <div className={styles.setting}><Link to="/">Setting</Link></div> */}
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
      
      <div className={styles.topbar}>
        <div className={styles.search}>
          <input
            type="text"
            value={text}
            className={styles.searchbox}
            onChange={handleSearchChange}
            placeholder="  Search..."
          />
        </div>
        <div className={styles.user}>
          <button className={styles.logout} onClick={() => navigate("/")}>
            로그아웃
          </button>
        </div>
      </div>
      <div className={styles.container}>
        <h2>이메일 보내기</h2>
        <form ref={form} onSubmit={handleSubmit}>
      <div className={styles.send}>
        <div>
          <label>보낸 사람 이름:</label>
          <input name="user_name" type="text" placeholder="이름" required />
        </div>
        <div>
          <label>받는 사람 이메일:</label>
          <input name="user_email" type="email" placeholder="이메일 주소" required />
        </div>
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
      <div className="textbtn">
        {/* <label>내용:</label> */}
        <textarea name="message" placeholder="내용을 입력하세요" width="500" height="500" required></textarea>
      </div>
      <button type="submit">전송</button>
    </form>
      </div>
    </div>
  );
}
