import { useState, useEffect } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import CustomCalendar from "./calender/calender";
import styles from "./main.module.css";
import Search from "./search";
import axios from "axios";

function Main({ onLogout }) {
  const isLogtin = sessionStorage.getItem("isAuthenticated");
  if (isLogtin) return <Navigate to="/" replace />;

  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState({ profile_image: "" });
  const [profileImage, setProfileImage] = useState("");
  const navigate = useNavigate();

  const fetchSearchData = async (query) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/search?query=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error("검색 데이터 가져오기 실패:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    alert("로그아웃 되었습니다.");
    navigate("/");
  };

  useEffect(() => {
    const img = sessionStorage.getItem("profileImage");
    const username = sessionStorage.getItem("username");
    if (!username) return;

    setProfileImage(img);
    axios.get(`/api/users/${username}`)
      .then((res) => setUser(res.data))
      .catch((err) => console.error("유저 정보 가져오기 실패:", err));
  }, []);

  return (
    <div className={styles.body}>
      <nav>
        <div className={styles.nav}>
          <div className={styles.logo1}><h2>Logo</h2><span></span></div>
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

      <div className={styles.mainboard}>
        <div className={styles.main}><div className={styles.title}><span>MAIN</span><div className={styles.morebtn}><Link to="/"></Link></div></div><div><h1>aaa</h1></div></div>
        <div className={styles.info}><div className={styles.title}><span>INFO</span><div className={styles.morebtn}><Link to="/info"></Link></div></div></div>
        <div className={styles.empty}><div className={styles.title}><span>Calender</span><div className={styles.morebtn}><Link to="/sendEmail"></Link></div></div><CustomCalendar /></div>
        <div className={styles.file}><div className={styles.title}><span>FILE</span><div className={styles.morebtn}><Link to="/file"></Link></div></div></div>
      </div>
    </div>
  );
}

export default Main;
