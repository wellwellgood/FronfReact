import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from './search.module.css';

const Search = ({
  showSettings = false,
  setShowSettings = () => {},
  showResults = false,
  setShowResults = () => {},
  searchText = '',
  setSearchText = () => {}
}) => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ profile_image: "" });
  const [profileImage, setProfileImage] = useState("");
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const infoRef = useRef();

  useEffect(() => {
    const storedImage = sessionStorage.getItem("profileImage");
    const username = sessionStorage.getItem("username");
    if (!username) return;

    setProfileImage(storedImage);

    axios.get(`/api/users/${username}`)
      .then((res) => setUser(res.data))
      .catch((err) => console.error("유저 정보 가져오기 실패:", err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(`.${styles.search}`) &&
        !infoRef.current?.contains(event.target)
      ) {
        setShowResults(false);
        setShowInfoForm(false);
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    setSearchText(e.target.value);
    setShowResults(e.target.value.trim() !== '');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchText.trim() === '') return;
    // 🔍 여기에 fetchSearchData(searchText) 같은 실제 검색 요청 로직 추가
  };

  const handleResultClick = (path) => {
    navigate(path);
    setShowResults(false);
    setSearchText('');
  };

  const toggleTheme = (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    setShowThemeMenu(false);
  };

  const handleProfileClick = () => {
    setShowInfoForm((prev) => !prev);
    setShowThemeMenu(false);
  };

  const toggleThemeMenu = () => {
    setShowThemeMenu((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className={styles.topbar}>
      <div className={styles.topbarContainer}>
        <div className={styles.search}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              value={searchText}
              onChange={handleInputChange}
              placeholder="검색어 입력..."
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}><FaSearch /></button>
          </form>
          {showResults && (
            <div className={styles.resultsPanel}>
              <p>검색 결과 표시 영역입니다.</p>
              <button onClick={() => setShowResults(false)} className={styles.closeResults}>
                닫기
              </button>
            </div>
          )}
        </div>

        <div className={styles.userInfoBox} ref={infoRef}>
          <img
            className={styles.profileImage}
            src={user.profile_image ? `https://react-server-wmqa.onrender.com${profileImage}` : "/img/icons8-user-48.png"}
            onClick={handleProfileClick}
            alt="프로필"
          />

          {showInfoForm && (
            <div className={styles.infoform}>
              <span className={styles.userInfo}>
                <h2>{`${user.name || user.username || "사용자"}님, 환영합니다!`}</h2>
              </span>

              <div className={styles.menuItem}>
                <button
                  onClick={() => {
                    console.log("⚙️ 설정 버튼 클릭됨");
                    setShowSettings(true);
                  }}
                  className={styles.settingsButton}
                >
                  ⚙️ 설정 열기
                </button>
              </div>

              <div className={styles.menuItem}>
                <span onClick={toggleThemeMenu} className={styles.link}>Theme</span>
                {showThemeMenu && (
                  <div className={styles.themeMenu}>
                    <div className={styles.light} onClick={() => toggleTheme("light")}>Light</div>
                    <div className={styles.dark} onClick={() => toggleTheme("dark")}>Dark</div>
                  </div>
                )}
              </div>

              <div className={styles.user}>
                <span className={styles.userbox}>
                  <button className={styles.logout} onClick={handleLogout}>로그아웃</button>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
